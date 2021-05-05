/**
  *
  * main() will be run when you invoke this action
  *
  * @param Cloud Functions actions accept a single parameter, which must be a JSON object.
  *
  * @return The output of this action, which must be a JSON object.
  *
  */
/**
  *
  * main() will be run when you invoke this action
  *
  * @param Cloud Functions actions accept a single parameter, which must be a JSON object.
  *
  * @return The output of this action, which must be a JSON object.
  *
  */
const request = require('request-promise');
const axios = require('axios');
const csv = require('csv-parse');
// const console-stamp = require('console-stamp');
const express = require('express');
async function multReq(requestUrls) {

    try {


        const [response1, response2, response3] = await Promise.all(requestUrls.map((url, index) => {
            //console.log(url['url']);
            return request(url['url']);
        }));

        return [response1, response2, response3]
    } catch (e) {
        console.log(e);
    }
}
async function main(params) {
    var startTime,endTime,appstart,append = Date.now();
    if (params.L1ORL2Indicator == 'L2') {
        console.log("Application Started:", Date.now());
        appstart = Date.now();
        // let accountId = '123_502_113'
        let accountId = params.accountId;
        let productCode = accountId.split('_')[1];

        //Translation Api calls goes here
        console.log("Translation Api started :", Date.now())
        startTime = Date.now();
        let translationResponse = await axios.post('https://e795f65b.us-south.apigw.appdomain.cloud/common-translation/post', {
            "SOURCE_SYSTEM": "PAS",
            "TARGET_SYSTEM": "GSSP"
        }).then(res => {
            return res.data;
        });
        console.log("Translation Api completed :", Date.now());
        endTime = Date.now();
        console.log("Translation API duration : ",(endTime - startTime));
        //console.log(translationResponse.ProductNameCode);
        let productNameCode;
        translationResponse.ProductNameCode.map(element => {
            //console.log(element.VALUE);
            if (element.VALUE == productCode) {
                productNameCode = element.KEY;
            }
        });
        //console.log(productNameCode);
        let productUrl = 'getClaimData_' + productNameCode;
        // console.log(productUrl);
        let obj;
        let requestUrls = [];

        let requestResponses = [];

        let multResponse = [];
        console.log("Github call for json struct started :", Date.now())
        startTime = Date.now();
        await request('http://nihalkaradan.github.io/assets/JSON/urls.json')
            .then(resp => {
                obj = JSON.parse(resp);
                // console.log(obj['getClaimData'][0]['getClaimData_ACC']);

                obj['getClaimData'][productUrl].map((url) => {

                    requestUrls.push(url);
                });

            });
        //console.log(requestUrls);
        console.log("Github call for json struct stopped :", Date.now())
        endTime = Date.now();
        console.log("Github call for json structure duration: ",(endTime-startTime));
        let k;
        
        console.log("Parallel calls started :", Date.now())
        startTime = Date.now();
        
        k = await multReq(requestUrls);
        
        console.log("Parallel calls stopped :", Date.now())
        endTime = Date.now();
        
        console.log("Parallel calls Duration : ",(endTime-startTime));
        
        let activityCardSpec;
        //console.log(k[1]);

        //Activity card spec file 

        // activityCardSpec =await axios.get('http://nihalkaradan.com/assets/JSON/claimsActivityCard.json').then(res=>{
        //     return res.data;
        // });
        activityCardSpec = [
            {
                "operation": "shift",
                "spec": {
                    "ClaimBookEventsVO": {
                        "eventsVO": {
                            "*": {
                                "eventName": "claimActivityCard[#2].activity",
                                "eventDescription": "claimActivityCard[#2].description",
                                "eventStartDate": "claimActivityCard[#2].date"
                            }
                        }
                    }
                }
            }
        ];

        //Claim Activity card request to Jolt service
        
        console.log("Jolt service (Claim Activity card) call started  :", Date.now());
        startTime = Date.now();

        let claimActivityCard = await axios.post('https://15bf83b1.us-east.apigw.appdomain.cloud/joltservice/transform', {
            "input": JSON.parse(k[2]), "spec": activityCardSpec

        }).then(res => {
            return JSON.parse(res.data.Output);
        }).catch(e => {
            console.log(e);
        });
        
        console.log("Jolt service (Claim Activity card) call ended  :", Date.now());
        endTime = Date.now();
        
        console.log("Jolt service (Claim Activity card) call Duration : ",(endTime - startTime));
        //Payment Summary card spec file 

        // paymentSummaryCardSpec =await axios.get('http://nihalkaradan.com/assets/JSON/paymentSummaryCard.json').then(res=>{
        //     return res.data;
        // });

        paymentSummaryCardSpec = [
            {
                "operation": "shift",
                "spec": {
                    "#NA": ["paymentSummaryCard.paymentTurboCard[#2].chequeNumber", "paymentSummaryCard.paymentTurboCard[#2].paymentAccount.nickName", "paymentSummaryCard.paymentTurboCard[#2].paymentAccount.accountNumber"],
                    "# ": "paymentSummaryCard.paymentTurboCard[#2].paymentAmount.currency",
                    "DisabilityClaimAdjInformationVO": {
                        "correspondingDisbursementVOs": {
                            "*": {
                                "paymentDueDate": "paymentSummaryCard.paymentTurboCard[#2].paymentDate",
                                "paymentMethod": "paymentSummaryCard.paymentTurboCard[#2].paymentMethod",
                                "netDisbursementAmt": "paymentSummaryCard.paymentTurboCard[#2].paymentAmount.amount"
                            }
                        }
                    }
                }
            }


        ];
        //Payment Summary Card request to Jolt service
        
        console.log("Jolt service (Payment Summary Card) call started  :", Date.now());
        startTime = Date.now();

        let paymentSummaryCard = await axios.post('https://15bf83b1.us-east.apigw.appdomain.cloud/joltservice/transform', {
            "input": JSON.parse(k[1]), "spec": paymentSummaryCardSpec

        }).then(res => {
            return JSON.parse(res.data.Output);
        }).catch(e => {
            console.log(e);
        });

        console.log("Jolt service (Payment Summary Card) call ended  :", Date.now());
        endTime = Date.now();
        console.log("Jolt service (Payment Summary Card) call Duration : ",(endTime - startTime));
        //extensionClaim card spec file 

        // extensionClaimCardSpec =await axios.get('http://nihalkaradan.com/assets/JSON/extensionClaim.json').then(res=>{
        //     return res.data;
        // });
        extensionClaimCardSpec = [
            {
                "operation": "shift",
                "spec": {
                    "AccClaimEventInformationVO": {
                        "claimEventSummaryVO": {
                            "claimStatus": "statusCode"
                        },
                        "payeeDetailVOs": {
                            "*": {
                                "clientId": "extension.clientId"
                            }
                        },
                        "claimantStatementVO": {
                            "patientInformationVO": {
                                "firstName": "claimantName.claimantFirstName",
                                "lastName": "claimantName.claimantLastName",
                                "relationShipToMember": "extension.relationShipToMember"
                            },
                            "accidentDetailInfoVO": {
                                "accidentDate": "extension.claimSummaryCard.dateOfAccident",
                                "accidentCity": "extension.claimSummaryCard.cityOfAccident",
                                "accidentState": "extension.claimSummaryCard.stateOfAccident"
                            }
                        },
                        "servicesVOs": {
                            "*": {
                                "serviceCT": "extension.claimSummaryCard.service"
                            }
                        }
                    }
                }
            }
        ];
        //Payment Summary Card request to Jolt service
        
        console.log("Jolt service (extensionClaim card) call started  :", Date.now());
        startTime = Date.now();
        
        let extensionClaimCard = await axios.post('https://e795f65b.us-south.apigw.appdomain.cloud/joltservice/transform', {
            "input": JSON.parse(k[0]), "spec": extensionClaimCardSpec

        }).then(res => {
            return JSON.parse(res.data.Output);
        }).catch(e => {
            console.log(e);
        });
        let statusCode = extensionClaimCard ['statusCode'];
        
        console.log("Jolt service (extensionClaim card) call ended  :", Date.now());
        endTime = Date.now();
        console.log("Jolt service (extensionClaim Card) call Duration : ",(endTime - startTime));
        
        //final translation happens here 
        
        translationResponse.ACC.map(element => {
            //console.log(element.VALUE);
            
            if (element.KEY == statusCode) {
                console.log(element.KEY);
                statusCode = element.VALUE;
            }
        });
        let item = {
            "number": "",
            "lob": "",
            "statusCode": statusCode,
            "product": {
                "typeCode": "500",
                "nameCode": ""
            },
            "claimActivityCard": "",
            "paymentSummaryCard": "",
            "claimantName": "",
            "extension": ""

        };
        item['number'] = params.claimIds;
        item['lob'] = 'A&H';
        //console.log(item['lob']);
        item['product']['nameCode'] = productCode;
        item['claimActivityCard'] = claimActivityCard['claimActivityCard'];
        item['paymentSummaryCard'] = paymentSummaryCard['paymentSummaryCard'];
        item['extension'] = extensionClaimCard['extension'];
        //console.log(Date.now());
        item['claimantName'] = extensionClaimCard['claimantName'];
        //console.log(Date.now());
        //  item['product']['typeCode'] = 500;
        console.log("Application Stopped:", Date.now());
        append = Date.now();
        console.log("application run time Duartion: ",(append-appstart));
         return { item }


    }
    else if (params.L1ORL2Indicator == 'L1') {

        return { params }
    }







}
