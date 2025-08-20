import fs from "fs";
import path from "path";

// Root folder of your project
const directory = "./"; 

// The text we want to replace
const oldDomain = "joegpt-search.vercel.app";
const newDomain = "joegpt.net";

// Recursively walk through all files
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
  if (!filePath.endsWith(".js") && !filePath.endsWith(".ts") && !filePath.endsWith(".json")) {
    return; // only process code/config files
  }

  let content = fs.readFileSync(filePath, "utf8");
  if (content.includes(oldDomain)) {
    const updated = content.replaceAll(oldDomain, newDomain);
    fs.writeFileSync(filePath, updated, "utf8");
    console.log(`✅ Updated: ${filePath}`);
  }
}

// Run
walk(directory, replaceInFile);
console.log("🎉 Done replacing all instances!");
