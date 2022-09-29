const { readdir } = require("fs/promises");
const path = require("path");
const { writeFileSync } = require("fs");

const getDirectories = async (path) =>
  (await readdir(path, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

async function main() {
  const adaptors = await getDirectories(
    path.resolve(process.cwd(), "src", "adaptors")
  );
  writeFileSync("./src/adaptors/all.js",
    `module.exports = [
${adaptors.map(p => `  {"name": "${p}", "adaptor": require("./${p}/index.js").default},`).join('\n')}
]`)
}

main()