import fs from "fs";

export function writeToFile(filename, values) {
  const data = values.join("\n");

  fs.writeFile(filename, data, (err) => {
    if (err) {
      console.error("Error writing to file:", err);
    } else {
      console.log("Values written to file successfully!");
    }
  });
}
