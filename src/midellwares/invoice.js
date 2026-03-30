const companyModels = require("../models/commpanyModel");
const { generateAndSaveInvoice } = require("../midellwares/pdfGenerator");
const userModel = require("../models/userModel");

const product = (order) => {
  let rows = "";
  let totalQuantity = 0;

  order?.product?.forEach((item, index) => {

    const qty = item?.quantity || 0;
    const price = item?.price || 0;
    const taxPercent = item?.taxPersent || 0;

    const taxableValue = price * qty;   
    const taxAmount = Math.ceil((taxableValue * taxPercent) / 100);
    const total = taxableValue + taxAmount;

    totalQuantity += qty;

    rows += `
      <tr>
        <td>${index + 1}</td>
        <td>${item?.productId?.title || "---"}</td>
        <td>${qty}</td>
        <td>${taxableValue}</td>
        <td>${order?.totalOfferDiscount || 0}</td>
        <td>${taxableValue}</td>
        ${order?.checkState
        ? `<td>${Math.ceil(taxAmount / 2)}</td>
               <td>${Math.ceil(taxAmount / 2)}</td>`
        : `<td>${taxAmount}</td>`
      }
        <td>${total}</td>
      </tr>
    `;
  });

  return { rows, totalQuantity };
};


exports.invoice = async (order) => {

  const company = await companyModels.findOne();
  const user = await userModel.findById(order.customerId);

  const invoiceData = product(order);

  const code = "invoice_" + Date.now();

  // await generateAndSaveInvoice({
  //   html: `
  //   <!DOCTYPE html>
  //   <html>
  //   <body style="font-family: Arial; font-size:12px">

  //     <h2 style="text-align:center">Tax Invoice</h2>

  //     <div>
  //       <strong>Invoice No:</strong> ${code}<br/>
  //       <strong>Order ID:</strong> ${order._id}<br/>
  //       <strong>Order Date:</strong> ${order.createdAt.toLocaleDateString()}
  //     </div>

  //     <hr/>

  //     <div>
  //       <strong>Bill To:</strong><br/>
  //       ${user?.fullName}<br/>
  //       ${order?.address?.address || ""}<br/>
  //       Phone: ${user?.phoneNumber}
  //     </div>

  //     <br/>

  //     <table border="1" width="100%" cellspacing="0" cellpadding="5">
  //       <tr>
  //         <th>S.No</th>
  //         <th>Product</th>
  //         <th>Qty</th>
  //         <th>Taxable</th>
  //         ${
  //           order?.checkState
  //             ? `<th>CGST</th><th>SGST</th>`
  //             : `<th>IGST</th>`
  //         }
  //         <th>Total</th>
  //       </tr>

  //       ${invoiceData.rows}

  //       <tr>
  //         <td></td>
  //         <td><b>Total</b></td>
  //         <td>${invoiceData.totalQuantity}</td>
  //         <td>${order.netAmount}</td>
  //         ${
  //           order?.checkState
  //             ? `<td>${Math.ceil(order.taxAmount / 2)}</td>
  //                <td>${Math.ceil(order.taxAmount / 2)}</td>`
  //             : `<td>${Math.ceil(order.taxAmount)}</td>`
  //         }
  //         <td><b>${order.orderTotal}</b></td>
  //       </tr>
  //     </table>

  //     <br/>
  //     <div style="text-align:right">
  //       <strong>Grand Total: ₹ ${order.orderTotal}</strong>
  //     </div>

  //     <br/>
  //     <div>
  //       <strong>${company?.name || "Company"}</strong><br/>
  //       GST: ${company?.gst || ""}<br/>
  //       ${company?.address || ""}
  //     </div>

  //   </body>
  //   </html>
  //   `,
  //   code
  // });

  await generateAndSaveInvoice({
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Invoice</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',Tahoma;}
table{border-collapse:collapse;width:100%;}
td,th{text-align:left;padding:4px;font-size:12px;}
th{border-top:2px solid black;border-bottom:2px solid black;}
#tablecont{font-weight:700;}
</style>
</head>

<body>

<div style="font-size:12px;padding:10px">

<div style="text-align:center;font-weight:bold;font-size:20px">
Tax Invoice
</div>

<header style="display:flex;justify-content:space-between;border-bottom:2px solid black;padding:8px 0;">
  <div>
    <div style="font-weight:bold;font-size:14px;">
    
      Sold By: ${company?.site_name || "Company Name" }
    </div>
    <div><strong>Ship-from Address:</strong></div>
    <div>${company?.address || ""}</div>
    <div><strong>GSTIN:</strong> ${company?.gst || ""}</div>
  </div>

  <div style="border:1px dotted black;padding:5px;">
    <strong>Invoice Number:</strong> ${code}
  </div>
</header>

<br/>

<div style="display:flex;justify-content:space-between">

  <div>
    <div><strong>Order ID:</strong> ${order._id}</div>
    <div><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
    <div><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</div>
  </div>

  <div>
    <div><strong>Bill To</strong></div>
    <div>${user?.fullName}</div>
    <div>
      ${order?.address?.address || ""}, 
      ${order?.address?.city || ""}, 
      ${order?.address?.state || ""} 
      (${order?.address?.pinCode || ""})
    </div>
    <div><strong>Phone:</strong> ${user?.phoneNumber}</div>
  </div>

  <div>
    <div><strong>Ship To</strong></div>
    <div>${user?.fullName}</div>
    <div>
      ${order?.address?.address || ""}, 
      ${order?.address?.city || ""}, 
      ${order?.address?.state || ""} 
      (${order?.address?.pinCode || ""})
    </div>
  </div>

</div>

<br/>

<div>Total Items: ${invoiceData.totalQuantity}</div>

<br/>

<table>
<tr>
<th>S.No</th>
<th>Title</th>
<th>Qty</th>
<th>Gross ₹</th>
<th>Discount ₹</th>
<th>Taxable ₹</th>
${order?.checkState ? `<th>CGST ₹</th><th>SGST ₹</th>` : `<th>IGST ₹</th>`}
<th>Total ₹</th>
</tr>

${invoiceData.rows}

<tr style="border-top:2px solid black;font-weight:bold;">
<td></td>
<td>Total</td>
<td>${invoiceData.totalQuantity}</td>
<td>${order.orderTotal}</td>
<td>${order.totalOfferDiscount || 0}</td>
<td>${order.netAmount}</td>
${order?.checkState
        ? `<td>${Math.ceil(order.taxAmount / 2)}</td>
       <td>${Math.ceil(order.taxAmount / 2)}</td>`
        : `<td>${Math.ceil(order.taxAmount)}</td>`
      }
<td>${order.orderTotal}</td>
</tr>

</table>

<br/>

<div style="display:flex;justify-content:space-between;border-top:2px solid black;padding-top:10px;">

  <div>
    <strong>Grand Total: ₹ ${order.orderTotal}</strong>
  </div>

  <div style="text-align:right;">
    <div>${company?.site_name}</div>
    ${company?.signatory
        ? `<img src="${company.signatory}" style="width:100px;height:50px"/>`
        : ""
      }
    <div>Authorized Signatory</div>
  </div>

</div>

<br/>

<div style="text-align:center;font-size:14px;margin-top:10px;">
<strong>Thank You!</strong> for shopping with us
</div>

<hr/>

<div style="font-size:10px;margin-top:10px;">
<strong>Terms & Conditions:</strong>
<ol>
<li>Goods once sold will not be taken back.</li>
<li>Payment within 7 days from invoice date.</li>
<li>Interest @18% p.a. applicable on delayed payment.</li>
<li>Subject to jurisdiction.</li>
</ol>
</div>

</div>
</body>
</html>
`,
    code
  });

  return code;
};

