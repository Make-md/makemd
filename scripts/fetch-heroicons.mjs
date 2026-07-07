import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Fetch all icon paths from GitHub API
async function fetchIconPaths(style, size) {
  const response = await fetch(`https://api.github.com/repos/tailwindlabs/heroicons/git/trees/master?recursive=1`);
  const data = await response.json();
  
  return data.tree
    .filter(item => item.path.startsWith(`optimized/${size}/${style}/`) && item.path.endsWith('.svg'))
    .map(item => item.path.replace(`optimized/${size}/${style}/`, '').replace('.svg', ''));
}

// Fetch SVG content for an icon
async function fetchSVG(iconName, style, size) {
  const url = `https://raw.githubusercontent.com/tailwindlabs/heroicons/master/optimized/${size}/${style}/${iconName}.svg`;
  const response = await fetch(url);
  if (!response.ok) return null;
  let svg = await response.text();
  // Remove aria-hidden and data-slot attributes for cleaner output
  svg = svg.replace(/\s+aria-hidden="true"/g, '');
  svg = svg.replace(/\s+data-slot="icon"/g, '');
  return svg;
}

// Main function
async function main() {
  console.log('Fetching Heroicons...');
  
  // Get all icon names for outline and solid styles (24px)
  const outlineIcons = await fetchIconPaths('outline', '24');
  const solidIcons = await fetchIconPaths('solid', '24');
  
  console.log(`Found ${outlineIcons.length} outline icons`);
  console.log(`Found ${solidIcons.length} solid icons`);
  
  // Read existing file
  const filePath = join(__dirname, '../src/adapters/obsidian/ui/icons.ts');
  let content = readFileSync(filePath, 'utf-8');
  
  // Find the heroIconsOutline object and replace it
  const outlineStartMatch = content.match(/(export const heroIconsOutline: Record<string, string> = \{)/);
  const outlineEndMatch = content.match(/\};\n\n\/\/ Export icon names/);
  
  if (!outlineStartMatch || !outlineEndMatch) {
    console.error('Could not find heroIconsOutline object in file');
    process.exit(1);
  }
  
  // Build new outline icons object
  console.log('Fetching outline icons...');
  let outlineContent = 'export const heroIconsOutline: Record<string, string> = {\n';
  
  for (let i = 0; i < outlineIcons.length; i++) {
    const iconName = outlineIcons[i];
    const svg = await fetchSVG(iconName, 'outline', '24');
    if (svg) {
      // Escape backticks and template literals
      const escapedSvg = svg.replace(/`/g, '\\`').replace(/\$/g, '\\$');
      outlineContent += `  "${iconName}": \`${escapedSvg}\`,\n`;
    }
    if ((i + 1) % 50 === 0) {
      console.log(`Fetched ${i + 1}/${outlineIcons.length} outline icons...`);
    }
    // Small delay to avoid rate limiting
    if ((i + 1) % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  outlineContent += '};\n';
  
  // Replace the outline section
  content = content.replace(
    /export const heroIconsOutline: Record<string, string> = \{[\s\S]*?\};\n\n\/\/ Export icon names/,
    outlineContent + '\n// Export icon names'
  );
  
  // Check if heroIconsSolid exists, if not add it after heroIconsOutline
  const solidExists = content.includes('export const heroIconsSolid');
  if (!solidExists) {
    console.log('Fetching solid icons...');
    let solidContent = '\nexport const heroIconsSolid: Record<string, string> = {\n';
    
    for (let i = 0; i < solidIcons.length; i++) {
      const iconName = solidIcons[i];
      const svg = await fetchSVG(iconName, 'solid', '24');
      if (svg) {
        const escapedSvg = svg.replace(/`/g, '\\`').replace(/\$/g, '\\$');
        solidContent += `  "${iconName}": \`${escapedSvg}\`,\n`;
      }
      if ((i + 1) % 50 === 0) {
        console.log(`Fetched ${i + 1}/${solidIcons.length} solid icons...`);
      }
      if ((i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    solidContent += '};\n';
    
    // Insert after heroIconsOutline
    content = content.replace(
      /(\n\/\/ Export icon names\nexport const heroIconNames = Object\.keys\(heroIconsOutline\);)/,
      solidContent + '$1'
    );
  }
  
  // Update heroIconNames to include both outline and solid
  content = content.replace(
    /export const heroIconNames = Object\.keys\(heroIconsOutline\);/,
    'export const heroIconNames = [\n  ...Object.keys(heroIconsOutline),\n  ...Object.keys(heroIconsSolid),\n];'
  );
  
  // Write updated file
  writeFileSync(filePath, content);
  console.log('Done! Updated icons.ts with all Heroicons');
}

main().catch(console.error);
