import { describe, expect, it } from "vitest";

import { findCloudLinks, mayHaveCloudLink, parseCloudLink } from "./links";

describe("cloud links", () => {
    it("recognises SharePoint sharing links by their type letter", () => {
        expect(parseCloudLink("https://contoso.sharepoint.com/:x:/s/Finance/EbXyZ?e=abc")).toMatchObject({ service: "sharepoint", kind: "excel", tenant: "contoso" });
        expect(parseCloudLink("https://contoso.sharepoint.com/:f:/s/Team/Eabc")).toMatchObject({ kind: "folder" });
    });

    it("recognises OneDrive for Business and consumer links", () => {
        expect(parseCloudLink("https://contoso-my.sharepoint.com/:w:/g/personal/ann_contoso_com/EaBc")).toMatchObject({ service: "onedrive", kind: "word", tenant: "contoso" });
        expect(parseCloudLink("https://1drv.ms/p/s!AbCdEf")).toMatchObject({ service: "onedrive", kind: "powerpoint" });
        expect(parseCloudLink("https://onedrive.live.com/?id=123")).toMatchObject({ service: "onedrive", kind: "file" });
    });

    it("takes the file name from direct document paths", () => {
        const l = parseCloudLink("https://contoso.sharepoint.com/sites/Sales/Shared%20Documents/Q3%20Plan.pptx?web=1");
        expect(l).toMatchObject({ kind: "powerpoint", name: "Q3 Plan.pptx" });
    });

    it("ignores lookalikes and plain http", () => {
        expect(parseCloudLink("https://sharepoint.com.evil.example/:w:/x")).toBeNull();
        expect(parseCloudLink("http://contoso.sharepoint.com/:w:/x")).toBeNull();
        expect(parseCloudLink("https://example.com/a.docx")).toBeNull();
    });

    it("finds up to three distinct links in text, without trailing punctuation", () => {
        const text = "See https://contoso.sharepoint.com/:w:/s/a/E1. And https://contoso.sharepoint.com/:w:/s/a/E1 again, plus https://example.com";
        const links = findCloudLinks(text);
        expect(links).toHaveLength(1);
        expect(links[0].url).toBe("https://contoso.sharepoint.com/:w:/s/a/E1");
        expect(mayHaveCloudLink("nothing here")).toBe(false);
    });
});
