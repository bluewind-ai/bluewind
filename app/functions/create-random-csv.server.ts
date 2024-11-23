// app/functions/create-random-csv.server.ts

import fs from "fs/promises";
import path from "path";

function generateSampleData() {
  const records = [];
  const companies = ["Apple", "Google", "Microsoft", "Amazon", "Meta"];
  const countries = ["USA", "UK", "France", "Germany", "Japan"];
  const products = ["Laptop", "Phone", "Tablet", "Watch", "Headphones"];

  for (let i = 0; i < 1000; i++) {
    const record = {
      company: companies[Math.floor(Math.random() * companies.length)],
      country: countries[Math.floor(Math.random() * countries.length)],
      product: products[Math.floor(Math.random() * products.length)],
      sales: Math.floor(Math.random() * 1000000),
      year: 2020 + Math.floor(Math.random() * 4),
    };
    records.push(record);
  }
  return records;
}

export async function createRandomCsv() {
  const records = generateSampleData();

  // Convert records to CSV format
  const headers = Object.keys(records[0]).join(",");
  const rows = records.map((record) => Object.values(record).join(","));
  const csvContent = [headers, ...rows].join("\n");

  // Ensure the data directory exists
  const dataDir = path.join(process.cwd(), "data");
  await fs.mkdir(dataDir, { recursive: true });

  // Write CSV file
  const filePath = path.join(dataDir, "sample.csv");
  await fs.writeFile(filePath, csvContent);

  return {
    status: "success",
    message: `Created CSV file with ${records.length} records at ${filePath}`,
    filePath,
  };
}
