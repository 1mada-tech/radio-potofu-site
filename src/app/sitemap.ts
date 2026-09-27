import type { MetadataRoute } from "next";
import { getEssaysByType, ESSAY_TYPE_SENRYU, ESSAY_TYPE_NOTE } from "@/lib/microcms";

const siteUrl = "https://www.radio-potofu.com";

const staticPaths = [
  "",
  "/episodes",
  "/senryu",
  "/note",
  "/netprint",
  "/pot",
  "/themes",
  "/pick",
  "/history",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [senryuEssays, noteEssays] = await Promise.all([
    getEssaysByType(ESSAY_TYPE_SENRYU),
    getEssaysByType(ESSAY_TYPE_NOTE),
  ]);

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${siteUrl}${path}`,
  }));

  const senryuEntries: MetadataRoute.Sitemap = senryuEssays.contents.map((essay) => ({
    url: `${siteUrl}/senryu/${essay.id}`,
    lastModified: essay.updatedAt,
  }));

  const noteEntries: MetadataRoute.Sitemap = noteEssays.contents.map((essay) => ({
    url: `${siteUrl}/note/${essay.id}`,
    lastModified: essay.updatedAt,
  }));

  return [...staticEntries, ...senryuEntries, ...noteEntries];
}
