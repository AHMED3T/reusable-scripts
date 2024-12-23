// importing required dependencies
const fs = require(`fs`);

/* 

IMPORTANT CAVEAT FOR USING THIS SCRIPT

Although this script generates zone file perfectly, there's an issue with AWS
Route 53 file import function. When these DNS entries are imported into AWS
Route 53, CNAME, SRV and MX records gets automatically appended by the root
domain name.

For example, if there's a CNAME record for subdomain _s1.stripe for the domain
monitairhealth.com with a value of __s1.stripe.domain-verify.stripe.com, Route
53 automatically appends the root domain to the value. Thus, the value becomes
__s1.stripe.domain-verify.stripe.com.monitairhealth.com.

This issue is consistent and after trying many things, I wasn't able to get rid
of this thing.

SOLUTION: You've to manually edit imported CNAME, SRV and MX records one by one
in the AWS Route 53 console.

*/

/* 

This script uses the following values

IMPORTED_DOMAIN -> Source domain name for the DNS records file. It should be without www prefix.
TARGET_DOMAIN -> Destination domain for the DNS records. It should be without www prefix.
TARGET_DOMAIN -> Filename to read DNS records from. It should be in .json format.
OUTPUT_FILE_NAME -> Filename to export zone file to. It should be .txt format.
DEFAULT_TTL -> Time To Live value for DNS record entries in seconds. Lower values suggested for testing purposes.


*/

// setting configuration params
const [IMPORTED_DOMAIN, TARGET_DOMAIN, INPUT_FILE_NAME, OUTPUT_FILE_NAME, DEFAULT_TTL] = [`monitairhealth.com.`, `getmonitair.com`, `dns_records.json`, `mapped-dns-zone-file.txt`, 300];

try {

  // initting a variable to store results
  let result = [];

  // checking if input file is in JSON format.
  if (!INPUT_FILE_NAME.toLowerCase().endsWith(`.json`)) {

    // throwing exception
    throw new Error(`Please provide DNS records in a .json file.`);

  }

  // reading dns records file from fs
  const data = JSON.parse(fs.readFileSync(INPUT_FILE_NAME, `utf-8`))?.ResourceRecordSets;

  // looping through all DNS entries
  for (const entry of data) {

    // fetching data from current DNS entry as required
    const { Name, Type, TTL, ResourceRecords } = entry

    // checking DNS records type and handling it accordingly
    if (Type === `NS` || Type === `SOA`) {
      /* 
        this code runs in case DNS record type is NS or SOA
      */

      // skipping iteration
      continue;

    } else if (Type === `SRV` || Type === `MX` || Type === `TXT`) {
      /*
        this code runs to handle SRV, MX and TXT record types,
        P.S. This DNS record type can have multiple values, and for that reason
        handling them separately
      */

      // looping through all values for 
      for (const record of ResourceRecords) {

        // pushing mapped entry into designated array
        result.push(`${Name.replace(IMPORTED_DOMAIN, TARGET_DOMAIN)} ${TTL || DEFAULT_TTL} ${Type} ${record.Value.replace(IMPORTED_DOMAIN, TARGET_DOMAIN)}`);

      }

    } else {
      /* 
      this code handles rest of the DNS records like A, AAAA, CNAME, etc.
      */

      // pushing mapped entry into designated array
      result.push(`${Name.replace(IMPORTED_DOMAIN, TARGET_DOMAIN)} ${TTL || DEFAULT_TTL} ${Type} ${ResourceRecords.map(record => record.Value.replace(IMPORTED_DOMAIN, TARGET_DOMAIN)).join(`\r\n`)}`);

    }

  }

  // writing results to a DNS zone file
  fs.writeFileSync(OUTPUT_FILE_NAME, result.join(`\r\n\r\n`), { encoding: `utf-8` });

} catch (error) {
  /* 
  this code runs in case of an error @ runtime  
  */

  // logging error to the console
  console.log(error)
}