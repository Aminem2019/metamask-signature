import { useState, useRef } from "react";
import { ethers } from "ethers";
import ErrorMessage from "./ErrorMessage";
import SuccessMessage from "./SuccessMessage";
import React from 'react';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { ParseMetadata } from "./Metadata";
const { createHash } = require('crypto');

function hash(string) {
  return createHash('sha256').update(string).digest('hex');
}

const verifyMessage = async ({
    message,
    address,
    signature
}) => {
    try {
        const signerAddr = await ethers.utils.verifyMessage(message, signature);
        if (signerAddr !== address) {
            return false;
        }

        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

export default function VerifyMessage() {
    const [error, setError] = useState();
    const [successMsg, setSuccessMsg] = useState();

    const handleVerification = async (e) => {
        e.preventDefault();
    		var fileblob;
        const file = e.target.files[0];
        const verifyfilename = document.getElementById('verifyfilename');
        const verifyfilesignature = document.getElementById('verifyfilesignature');
        const verifyfilehash = document.getElementById('verifyfilehash');
        fileblob = file;
        setSuccessMsg();
        setError();

        var zip = new JSZip();
        zip.loadAsync(fileblob)
            .then(async function(zip) {
                var zfiles = zip.files;
                var fileSignature = "signature.json";
                var fileDoc = "";
                //console.log(zfiles);
								var fNum = 0;
                zip.forEach((relPath, file) => {
                    if (relPath != fileSignature) {
                        fileDoc = relPath;
                    }
										fNum += 1;
                });
                // TODO check that fileSignature and fileAddr exists
                if (fNum != 2) {
                    console.log("there is more or less (" + fNum + ") than 3 files");
                    setError("This archive does not contain 3 files as expected!");
										return;
                }
        				verifyfilename.textContent = "File Name: " + fileDoc;
								// file content goes here
                var doc;
                var signDoc;
                doc = await zip.file(fileDoc).async("text");
                signDoc = await zip.file(fileSignature).async("text");
								// Generate the hash of the document
								var docHash;
								docHash = hash(doc);
								// extract signature and address (parse json then put in variables)
								const signInfo = ParseMetadata(signDoc);
								//check signature
								var isValid = false;
								if (signInfo) {
									var addr;
									var signature;
									addr = signInfo.signer;
									signature = signInfo.signature;
									verifyfilesignature.textContent = "Signer Address: " + addr;
									verifyfilehash.textContent = "File Hash: " + docHash;
									isValid = await verifyMessage({
											setError,
											message: docHash,
											address: addr,
											signature: signature
									});
								}
                if (isValid) {
                    setSuccessMsg("Signature is valid!");
                } else {
                    setError("Invalid signature");
                }
            })
    };

	  // Create a reference to the hidden file input element
    const hiddenFileInputVerify = React.useRef(null);

  	const handleClickVerify = event => {
    		hiddenFileInputVerify.current.click();
  	};

    return (
				<div className="credit-card w-full shadow-lg mx-auto rounded-xl bg-white">
					<main className="mt-4 p-4">
						<h1 className="text-xl font-semibold text-gray-700 text-center">
							Verify signature
						</h1>
					</main>
				  <div className="mt-2 p-2">
						<input className="file-input" type="file"  ref={hiddenFileInputVerify} id="file-selector" onChange={handleVerification} style={{display: 'none'}} />
						<button onClick={handleClickVerify} type="submit" className="btn btn-primary submit-button focus:ring focus:outline-none w-full">
							Select & Verify
						</button>
  				</div>
  				<div>
						<p id="verifyfilename"></p>
						<p id="verifyfilehash"></p>
						<p id="verifyfilesignature"></p>
						<ErrorMessage message={error} />
						<SuccessMessage message={successMsg} />
					</div>
				</div>
    );
}
