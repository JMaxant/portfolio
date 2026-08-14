// Validates the CV data files given as arguments against schemas/cv.schema.json.
//
// ajv-cli would do this in a single lefthook line, but it has not been released since April
// 2023 and pulls glob@7 and inflight, both deprecated, which makes npm print a warning block
// on every run. The ajv library itself is maintained and has four dependencies, none of them
// deprecated, so the twenty lines below are cheaper than the noise.

import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import Ajv from "ajv";

const schemaPath = fileURLToPath(new URL("./schemas/cv.schema.json", import.meta.url));
const validate = new Ajv({allErrors: true}).compile(
  JSON.parse(readFileSync(schemaPath, "utf8"))
);

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: check-cv-schema.mjs <file.json>...");
  process.exit(2);
}

let failed = false;
for (const file of files) {
  if (validate(JSON.parse(readFileSync(file, "utf8")))) {
    console.log(`${file} valid`);
    continue;
  }
  failed = true;
  for (const {instancePath, message} of validate.errors) {
    console.error(`${file}${instancePath}: ${message}`);
  }
}

process.exit(failed ? 1 : 0);
