/**
 * The WebGL programs that draw the map.
 *
 * A room is three layers (sigma draws each layer for all nodes before the next): a soft glow for
 * unread, mention and selected rooms; the avatar, or the room's colour; then the status ring with
 * a thin gap that separates it from the avatar. Space circles are a flat fill with a rim.
 */

import { createNodeCompoundProgram, NodeProgram, type NodeLabelDrawingFunction, type NodeProgramType, type ProgramInfo } from "sigma/rendering";
import type { NodeDisplayData, RenderParams } from "sigma/types";
import { floatColor } from "sigma/utils";
import { createNodeBorderProgram } from "@sigma/node-border";
import { createNodeImageProgram } from "@sigma/node-image";

import type { NodeAttrs } from "../views";

// WebGL constants, written out so this module doesn't need a WebGL context to load.
const FLOAT = 5126;
const UNSIGNED_BYTE = 5121;
const TRIANGLES = 4;

const HALO_VERTEX = /*glsl*/ `
attribute vec4 a_id;
attribute vec4 a_color;
attribute vec2 a_position;
attribute float a_size;
attribute float a_spread;
attribute float a_angle;

uniform mat3 u_matrix;
uniform float u_sizeRatio;
uniform float u_correctionRatio;

varying vec4 v_color;
varying vec2 v_diffVector;
varying float v_radius;
varying float v_inner;

void main() {
  float inner = a_size * u_correctionRatio / u_sizeRatio * 2.0;
  float radius = inner * a_spread;
  // One triangle around the circle: its inscribed circle has the radius, so the corners reach 2x.
  vec2 diffVector = radius * 2.0 * vec2(cos(a_angle), sin(a_angle));
  gl_Position = vec4((u_matrix * vec3(a_position + diffVector, 1)).xy, 0, 1);
  v_diffVector = diffVector;
  v_radius = radius;
  v_inner = inner;
  #ifdef PICKING_MODE
  v_color = a_id;
  #else
  v_color = a_color;
  #endif
}
`;

const HALO_FRAGMENT = /*glsl*/ `
precision highp float;

varying vec4 v_color;
varying vec2 v_diffVector;
varying float v_radius;
varying float v_inner;

void main(void) {
  #ifdef PICKING_MODE
  // The glow isn't part of the node: clicks there go to whatever is underneath.
  discard;
  #else
  float dist = length(v_diffVector);
  if (dist > v_radius) discard;
  // Strongest at the node's edge, fading out smoothly. sigma blends premultiplied colours.
  float t = clamp((dist - v_inner * 0.8) / (v_radius - v_inner * 0.8), 0.0, 1.0);
  float glow = pow(1.0 - t, 2.2) * v_color.a;
  gl_FragColor = vec4(v_color.rgb * glow, glow);
  #endif
}
`;

type HaloUniform = "u_sizeRatio" | "u_correctionRatio" | "u_matrix";

/** A soft glow around nodes with a `haloColor` (and none around the others). */
class NodeHaloProgram extends NodeProgram<HaloUniform, NodeAttrs> {
    getDefinition() {
        return {
            VERTICES: 3,
            VERTEX_SHADER_SOURCE: HALO_VERTEX,
            FRAGMENT_SHADER_SOURCE: HALO_FRAGMENT,
            METHOD: TRIANGLES,
            UNIFORMS: ["u_sizeRatio", "u_correctionRatio", "u_matrix"] as const,
            ATTRIBUTES: [
                { name: "a_position", size: 2, type: FLOAT },
                { name: "a_size", size: 1, type: FLOAT },
                { name: "a_spread", size: 1, type: FLOAT },
                { name: "a_color", size: 4, type: UNSIGNED_BYTE, normalized: true },
                { name: "a_id", size: 4, type: UNSIGNED_BYTE, normalized: true },
            ],
            CONSTANT_ATTRIBUTES: [{ name: "a_angle", size: 1, type: FLOAT }],
            CONSTANT_DATA: [[0], [(2 * Math.PI) / 3], [(4 * Math.PI) / 3]],
        };
    }

    processVisibleItem(nodeIndex: number, startIndex: number, data: NodeDisplayData): void {
        const halo = data as NodeDisplayData & { haloColor?: string; haloSpread?: number };
        const array = this.array;
        array[startIndex++] = data.x;
        array[startIndex++] = data.y;
        array[startIndex++] = data.size;
        array[startIndex++] = halo.haloSpread ?? 2;
        array[startIndex++] = floatColor(halo.haloColor ?? "rgba(0,0,0,0)");
        array[startIndex++] = nodeIndex;
    }

    setUniforms(params: RenderParams, { gl, uniformLocations }: ProgramInfo<HaloUniform>): void {
        gl.uniform1f(uniformLocations.u_correctionRatio, params.correctionRatio);
        gl.uniform1f(uniformLocations.u_sizeRatio, params.sizeRatio);
        gl.uniformMatrix3fv(uniformLocations.u_matrix, false, params.matrix);
    }
}

export interface ImageProgramWithTextures {
    /** `@sigma/node-image` keeps its texture atlas on the program class; "newTexture" fires on each update. */
    textureManager?: { on(event: "newTexture", cb: () => void): void; off(event: "newTexture", cb: () => void): void };
}

export interface Programs {
    settings: {
        nodeProgramClasses: Record<string, NodeProgramType<NodeAttrs>>;
        nodeHoverProgramClasses: Record<string, NodeProgramType<NodeAttrs>>;
        defaultNodeType: string;
    };
    textures: ImageProgramWithTextures["textureManager"];
}

/**
 * Programs for one sigma instance. The image program must not be shared between instances: it
 * holds the instance's avatar textures.
 */
export function buildPrograms(drawLabel: NodeLabelDrawingFunction<NodeAttrs>, drawHover: NodeLabelDrawingFunction<NodeAttrs>): Programs {
    const image = createNodeImageProgram<NodeAttrs>({
        drawingMode: "background",
        keepWithinCircle: true,
        objectFit: "cover",
        size: { mode: "max", value: 96 },
        crossOrigin: "anonymous",
        // The default 500 ms makes avatars appear late, in visible waves.
        debounceTimeout: 40,
    });
    const ring = createNodeBorderProgram<NodeAttrs>({
        borders: [
            { size: { attribute: "borderSize", defaultValue: 0, mode: "pixels" }, color: { attribute: "borderColor", defaultValue: "rgba(0,0,0,0)" } },
            { size: { attribute: "gapSize", defaultValue: 0, mode: "pixels" }, color: { attribute: "gapColor", defaultValue: "rgba(0,0,0,0)" } },
            { size: { fill: true }, color: { transparent: true } },
        ],
    });
    const room = createNodeCompoundProgram<NodeAttrs>([NodeHaloProgram as unknown as NodeProgramType<NodeAttrs>, image, ring], drawLabel, drawHover);
    const container = createNodeBorderProgram<NodeAttrs>({
        borders: [
            { size: { attribute: "borderSize", defaultValue: 1, mode: "pixels" }, color: { attribute: "borderColor" } },
            { size: { fill: true }, color: { attribute: "color" } },
        ],
        drawLabel,
        drawHover,
    });
    // Hovered nodes are drawn again on a layer above everything. A space circle would then cover
    // its own rooms, and a room the name inside it; so nothing is redrawn, and the tooltip shows
    // what's under the pointer.
    // (node-border generates invalid GLSL for a lone fill layer, hence the empty border.)
    const invisible = createNodeBorderProgram<NodeAttrs>({
        borders: [
            { size: { value: 0 }, color: { transparent: true } },
            { size: { fill: true }, color: { transparent: true } },
        ],
        drawLabel,
        drawHover,
    });
    return {
        settings: {
            // sigma draws one type after the other, in this order: space circles first, under their rooms.
            nodeProgramClasses: { container, room },
            nodeHoverProgramClasses: { container: invisible, room: invisible },
            defaultNodeType: "room",
        },
        textures: (image as ImageProgramWithTextures).textureManager,
    };
}
