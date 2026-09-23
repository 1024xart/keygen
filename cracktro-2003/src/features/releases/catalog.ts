export const releases = [
  {
    id: "DS15",
    number: "010",
    title: "dark_souls_15",
    description: "happy anniversary to the first video game ever made",
    file: "/art/releases/dark_souls_15.gif",
    size: "1.44 MB",
    version: "1.0",
  },
  {
    id: "TR01",
    number: "001",
    title: "if_looks_could_shimmer",
    file: "/art/releases/art1.gif",
    size: "7.87 MB",
    version: "1.0",
  },
  {
    id: "BMR08",
    number: "002",
    title: "empty_space",
    file: "/art/releases/art8.gif",
    size: "3.00 MB",
    version: "1.0",
  },
  {
    id: "BR09",
    number: "003",
    title: "this_was_my_first_attempt",
    file: "/art/releases/art9.gif",
    size: "827 KB",
    version: "1.0",
  },
  {id:"ST04",number:"004",title:"study 04",file:"/art/releases/art1.gif",size:"placeholder",version:"1.0"},
  {id:"ST05",number:"005",title:"study 05",file:"/art/releases/art8.gif",size:"placeholder",version:"1.0"},
  {id:"ST06",number:"006",title:"study 06",file:"/art/releases/art9.gif",size:"placeholder",version:"1.0"},
  {id:"ST07",number:"007",title:"study 07",file:"/art/releases/art1.gif",size:"placeholder",version:"1.0"},
  {id:"ST08",number:"008",title:"study 08",file:"/art/releases/art8.gif",size:"placeholder",version:"1.0"},
  {id:"ST09",number:"009",title:"study 09",file:"/art/releases/art9.gif",size:"placeholder",version:"1.0"},
] as const;

export type Release = (typeof releases)[number];
export type ReleaseId = Release["id"];
export function getRelease(id: ReleaseId) {
  return releases.find((release) => release.id === id)!;
}
