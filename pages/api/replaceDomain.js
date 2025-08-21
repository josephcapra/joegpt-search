import fs from "fs";
import path from "path";

// Root folder of your project
const directory = "./"; 

// Old and new domains
const oldDomain = "joegpt-search.vercel.app";
const newDomain = "www.joegpt.net";

// File extensions to scan
const textFileExtensions = [
  ".js", ".ts", ".jsx", ".tsx",
  ".json", ".env", ".md", ".html",
  ".css", ".yml", ".yaml", ".txt",
  ".config", ".lock", ".cjs", ".mjs"
];

// Recursively walk through all files in the project
function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

// Replace function
function replaceInFile(filePath) {
  if (!textFileExtensions.some(ext => filePath.endsWith(ext))) {
    return; // Skip binaries or unknown file types
  }

  let content = fs.readFileSync(filePath, "utf8");
  if (content.includes(oldDomain)) {
    const updated = content.replaceAll(oldDomain, newDomain);
    fs.writeFileSync(filePath, updated, "utf8");
    console.log(`✅ Updated: ${filePath}`);
  }
}

// Run the replacement
walk(directory, replaceInFile);
console.log("🎉 Done replacing all instances across project!");

