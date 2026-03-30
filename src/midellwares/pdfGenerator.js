const puppeteer = require("puppeteer");
const { Credentials } = require("aws-sdk");
const S3 = require("aws-sdk/clients/s3");
const logger = require("../../tmp/logger");

exports.generateAndSaveInvoice = async ({ html, code }) => {
  try {
    // Launch Puppeteer with the new headless mode
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Use the new headless mode
    });

    const page = await browser.newPage();
    await page.setContent(html);

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });
    console.log(pdfBuffer)
    // Close Puppeteer
    await browser.close();

    // Initialize AWS S3
    const s3Client = new S3({
      region: process.env.LINODE_OBJECT_STORAGE_REGION || "sgp1",
      endpoint:
        process.env.LINODE_OBJECT_STORAGE_ENDPOINT ||
        "https://sgp1.digitaloceanspaces.com",
      sslEnabled: true,
      s3ForcePathStyle: false,
      credentials: new Credentials({
        accessKeyId:
          process.env.LINODE_OBJECT_STORAGE_ACCESS_KEY_ID || "DO00Z942D6M3HUV48DCM",
        secretAccessKey: "psMqLH/f+54S/fiZwewr2IM/ah8f8K+O5PzVjU8mCyw",
      }),
    });

    // Upload PDF to S3 bucket
    const params = {
      Bucket: "satyakabir-bucket",
      Key: `${process.env.BUCKET_FOLDER_PATH}${code}.pdf`,
      Body: pdfBuffer,
      ACL: "public-read",
      ContentType: "application/pdf",
    };
    console.log(params)
    logger.info(`params : ${params}`);
    // let a = await s3Client.upload(params).promise();
    const uploadResult = await s3Client.upload(params).promise();
    console.log(uploadResult);
    logger.info(`Invoice generated and saved successfully : ${uploadResult.Location}`);    // console.log(s3Client.deleteObject(params).promise())

    console.log("Upload Success:", uploadResult.Location);

    // console.log(a);
    // return a;
  } catch (error) {
    console.error("Error:", error.message);
    logger.error(`Error: ${error.message}`);
  }
};
