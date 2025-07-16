const { populateAllData } = require('./populateData');

async function main() {
  console.log('Wedmantra Database Population Tool\n');
  
  const args = process.argv.slice(2);
  const clearFirst = args.includes('--clear') || args.includes('-c');
  
  if (clearFirst) {
    console.log('WARNING: This will delete ALL existing data!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  await populateAllData(clearFirst);
}

main().catch(console.error);