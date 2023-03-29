const Imap = require("imap");
const { simpleParser } = require("mailparser");

function initializeImap(imapConfig) {
  const imap = new Imap(imapConfig);

  imap.once("error", (err) => {
    console.log("IMAP error:", err);
  });

  imap.once("end", () => {
    console.log("Disconnected from the IMAP server");
  });

  imap.connect();

  return imap;
}

function checkForUberCode(toAddress, imap) {
  return new Promise((resolve, reject) => {
    imap.openBox("INBOX", false, (err, box) => {
      if (err) {
        console.log("Error opening inbox: " + err);
        reject(err);
        return;
      }

      console.log("Opened inbox");
      imap.search(
        [
          "UNSEEN",
          ["FROM", "admin@uber.com"],
          ["SUBJECT", "Welcome to Uber"],
          ["TO", toAddress],
        ],
        (err, results) => {
          if (err) {
            console.log("Error searching for email: " + err);
            resolve(null);
            return;
          }
          try {
            const latestEmail = results.slice(-1)[0];
            const emailContents = imap.fetch(latestEmail, { bodies: "" });
            emailContents.on("message", (msg) => {
              msg.on("body", async (stream, info) => {
                const parsedEmail = await simpleParser(stream);

                const regex = /<p>(\d{4})<\/p>/;
                const match = regex.exec(parsedEmail.html);
                const result = match ? match[1] : null;

                if (result != null) {
                  console.log("Data extracted from email:", match[1]);
                  const verificationCode = match[1];
                  resolve(verificationCode);
                } else {
                  resolve(null);
                }

              });
            });

            emailContents.once("error", (fetchErr) => {
              console.log("Error fetching email:", fetchErr);
              reject(fetchErr);
            });

            emailContents.once("end", () => {
              console.log("Finished fetching email");
            });
          } catch (err) {
            resolve(null);
          }
        }
      );
    });
  });
}

module.exports = { initializeImap, checkForUberCode };
