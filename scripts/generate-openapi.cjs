const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const srcSwaggerPath = path.join(repoRoot, 'src', 'docs', 'swagger.ts');
const { getOpenApiDocument } = require(srcSwaggerPath);
const doc = getOpenApiDocument();

const outputPath = path.join(repoRoot, 'openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(doc, null, 2));
console.log(`OpenAPI generated at ${outputPath}`);
