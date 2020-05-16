const Campaign = require('../models/campaign.model.js');
var FCM = require('fcm-node');
var serverKey = 'FIREBASE-SERVER-KEY';
//put your server key here
var fcm = new FCM(serverKey);
var moment = require('moment'); 

// Import and initialize the Firebase Admin SDK.
const admin = require('firebase-admin');
var serviceAccount = require("/PATH-TO-FIREBASE-SERVICE-ACCOUNT-JSON-FILE");
const axios = require('axios');
mailjet_public_key= "REPLACE_KEY";
mailjet_private_key= "REPLACE_KEY";
const mailjet = require ('node-mailjet')
.connect(mailjet_public_key, mailjet_private_key)


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  
// Create and Save a new campaign
exports.create = (req, res) => {

    // Create a campaign
    const campaign = new Campaign({
        title: req.body.title || "Untitled campaign",
        channels: req.body.channels,
        startdate: req.body.startdate,
        enddate: req.body.enddate,
        audience: req.body.audience,
        message: req.body.message
    });

    // Save campaign in the database
    campaign.save()
        .then(data => {
            res.send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the campaign."
            });
        });
};

// Retrieve and return all campaigns from the database.
exports.findAll = (req, res) => {
    Campaign.find()
        .then(campaigns => {
            res.send(campaigns);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving campaigns."
            });
        });
};

// Find a single campaign with a campaignId
exports.findOne = (req, res) => {
    Campaign.findById(req.params.campaignId)
        .then(campaign => {
            if (!campaign) {
                return res.status(404).send({
                    message: "campaign not found with id " + req.params.campaignId
                });
            }
            res.send(campaign);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({
                    message: "campaign not found with id " + req.params.campaignId
                });
            }
            return res.status(500).send({
                message: "Error retrieving campaign with id " + req.params.campaignId
            });
        });
};

// Send a single campaign with a campaignId
exports.sendCampaign = async (req, res) => {
    console.log("enviando mensajes de campaña: ",req.params.campaignId)
    try {
        var campaign = await Campaign.findById(req.params.campaignId)  
        var correos = []
        var tokens = []
        var canales = campaign.channels;

        //se llenan los array de tokens y correos destinatarios
        for (var key in campaign.audience){
            // por cada filtro
            console.log("campaign audience content = ", campaign.audience[key])
            contenido = JSON.stringify(campaign.audience[key])

            getclientes = await axios.get('http://localhost:4000/users/find/'.concat(contenido))
            .then(response => {                

                for (let index = 0; index < response.data.length; index++) {
                    const element = response.data[index];

                    var now = moment();

                    //TO DO: PONER NUMEROS QUE COMPARAN CON LA DIFERENCIA DE DIAS EN LA BASE DE DATOS Y PARAMETRIZARLOS COMO REGLAS DE OMNICANALIDAD

                    if(canales.includes("PUSH")){
                        if(canales.includes("EMAIL")){
                            let femail = moment(element.fechaEmail);
                            let resta = now.diff(femail,"days");
                            //si no han pasado mas de 3 dias desde el ultimo email hacia el usuario se salta la iteracion
                            if(resta<3){
                                continue;
                            }
                        }

                        let fpush = moment(element.fechaPush);
                        let resta = now.diff(fpush,"days");                        
                        //si han pasado mas de 7 dias desde el ultimo mensaje push hacia el usuario
                        if(resta>7){
                            //se chequea si esta el token ya y si no se guarda para realizar el envío
                            if(!tokens.includes(element.token)){
                                tokens.push(element.token);
                            }
                        }                                           
                    }
            
                    if(canales.includes("EMAIL")){
                        if(canales.includes("PUSH")){
                            let fpush = moment(element.fechaPush);
                            let resta = now.diff(fpush,"days");
                            //si no han pasado mas de 3 dias desde el ultimo mensaje push hacia el usuario se salta la iteracion
                            if(resta<3){
                                continue;
                            }
                        }
                        let femail = moment(element.fechaEmail);
                        let resta = now.diff(femail,"days");
                        //si han pasado mas de 7 dias desde el ultimo email hacia el usuario
                        if(resta>7){
                            //se chequea si esta el correo ya y si no se guarda para realizar el envío
                            if(!correos.includes(element.email)){
                                correos.push(element.email);
                            }
                        }                   
                    }
                }
            })
            .catch(error => {
            console.log(error);
            });
        }
       

        const text = campaign.message
        const payload = {
            notification: {
                title: `Oferta especial!!!`,
                body: text ? (text.length <= 100 ? text : text.substring(0, 97) + '...') : '',
                click_action: `http://localhost:5000`,
            }
        };

        if (correos.length > 0) {
            const request = mailjet
            .post("send", {'version': 'v3.1'})
            .request({
            "Messages":[
                        {
                "From": {
                    "Email": "adolfo.ovalle@usach.cl",
                    "Name": "Cencosud"
                        },
                
                "To": [
                    {
                    "Email": correos.toString(),
                    "Name": "Cliente"
                    }
                ],
                "Subject": campaign.message,
                "TextPart": "Email enviado usando Mailjet",
                "HTMLPart": '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head> <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /> <title>*|MC:SUBJECT|*</title> <style type="text/css">/* /\/\/\/\/\/\/\/\/ CLIENT-SPECIFIC STYLES /\/\/\/\/\/\/\/\/ */#outlook a{padding:0;} /* Force Outlook to provide a "view in browser" message */.ReadMsgBody{width:100%;} .ExternalClass{width:100%;} /* Force Hotmail to display emails at full width */.ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height: 100%;} /* Force Hotmail to display normal line spacing */body, table, td, p, a, li, blockquote{-webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;} /* Prevent WebKit and Windows mobile changing default text sizes */table, td{mso-table-lspace:0pt; mso-table-rspace:0pt;} /* Remove spacing between tables in Outlook 2007 and up */img{-ms-interpolation-mode:bicubic;} /* Allow smoother rendering of resized image in Internet Explorer *//* /\/\/\/\/\/\/\/\/ RESET STYLES /\/\/\/\/\/\/\/\/ */body{margin:0; padding:0;}img{border:0; height:auto; line-height:100%; outline:none; text-decoration:none;}table{border-collapse:collapse !important;}body, #bodyTable, #bodyCell{height:100% !important; margin:0; padding:0; width:100% !important;}/* /\/\/\/\/\/\/\/\/ TEMPLATE STYLES /\/\/\/\/\/\/\/\/ */#bodyCell{padding:20px;}#templateContainer{width:600px;}/* ========== Page Styles ========== *//*** @tab Page* @section background style* @tip Set the background color and top border for your email. You may want to choose colors that match your companys branding.* @theme page*/body, #bodyTable{/*@editable*/ background-color:#DEE0E2;}/*** @tab Page* @section background style* @tip Set the background color and top border for your email. You may want to choose colors that match your companys branding.* @theme page*/#bodyCell{/*@editable*/ border-top:4px solid #BBBBBB;}/*** @tab Page* @section email border* @tip Set the border for your email.*/#templateContainer{/*@editable*/ border:1px solid #BBBBBB;}/*** @tab Page* @section heading 1* @tip Set the styling for all first-level headings in your emails. These should be the largest of your headings.* @style heading 1*/h1{/*@editable*/ color:#202020 !important;display:block;/*@editable*/ font-family:Helvetica;/*@editable*/ font-size:26px;/*@editable*/ font-style:normal;/*@editable*/ font-weight:bold;/*@editable*/ line-height:100%;/*@editable*/ letter-spacing:normal;margin-top:0;margin-right:0;margin-bottom:10px;margin-left:0;/*@editable*/ text-align:left;}/*** @tab Page* @section heading 2* @tip Set the styling for all second-level headings in your emails.* @style heading 2*/h2{/*@editable*/ color:#404040 !important;display:block;/*@editable*/ font-family:Helvetica;/*@editable*/ font-size:20px;/*@editable*/ font-style:normal;/*@editable*/ font-weight:bold;/*@editable*/ line-height:100%;/*@editable*/ letter-spacing:normal;margin-top:0;margin-right:0;margin-bottom:10px;margin-left:0;/*@editable*/ text-align:left;}/*** @tab Page* @section heading 3* @tip Set the styling for all third-level headings in your emails.* @style heading 3*/h3{/*@editable*/ color:#606060 !important;display:block;/*@editable*/ font-family:Helvetica;/*@editable*/ font-size:16px;/*@editable*/ font-style:italic;/*@editable*/ font-weight:normal;/*@editable*/ line-height:100%;/*@editable*/ letter-spacing:normal;margin-top:0;margin-right:0;margin-bottom:10px;margin-left:0;/*@editable*/ text-align:left;}/*** @tab Page* @section heading 4* @tip Set the styling for all fourth-level headings in your emails. These should be the smallest of your headings.* @style heading 4*/h4{/*@editable*/ color:#808080 !important;display:block;/*@editable*/ font-family:Helvetica;/*@editable*/ font-size:14px;/*@editable*/ font-style:italic;/*@editable*/ font-weight:normal;/*@editable*/ line-height:100%;/*@editable*/ letter-spacing:normal;margin-top:0;margin-right:0;margin-bottom:10px;margin-left:0;/*@editable*/ text-align:left;}/* ========== Header Styles ========== *//*** @tab Header* @section preheader style* @tip Set the background color and bottom border for your emails preheader area.* @theme header*/#templatePreheader{/*@editable*/ background-color:#F4F4F4;/*@editable*/ border-bottom:1px solid #CCCCCC;}/*** @tab Header* @section preheader text* @tip Set the styling for your emails preheader text. Choose a size and color that is easy to read.*/.preheaderContent{/*@editable*/ color:#808080;/*@editable*/ font-family:Helvetica;/*@editable*/ font-size:10px;/*@editable*/ line-height:125%;/*@editable*/ text-align:left;}/*** @tab Header* @section preheader link* @tip Set the styling for your emails preheader links. Choose a color that helps them stand out from your text.*/.preheaderContent a:link, .preheaderContent a:visited, /* Yahoo! Mail Override */ .preheaderContent a .yshortcuts /* Yahoo! Mail Override */{/*@editable*/ color:#606060;/*@editable*/ font-weight:normal;/*@editable*/ text-decoration:underline;}/*** @tab Header* @section header style* @tip Set the background color and borders for your emails header area.* @theme header*/#templateHeader{/*@editable*/ background-color:#F4F4F4;/*@editable*/ border-top:1px solid #FFFFFF;/*@editable*/ border-bottom:1px solid #CCCCCC;}/*** @tab Header* @section header text* @tip Set the styling for your emails header text. Choose a size and color that is easy to read.*/.headerContent{/*@editable*/ color:#505050;/*@editable*/ font-family:Helvetica;/*@editable*/ font-size:20px;/*@editable*/ font-weight:bold;/*@editable*/ line-height:100%;/*@editable*/ padding-top:0;/*@editable*/ padding-right:0;/*@editable*/ padding-bottom:0;/*@editable*/ padding-left:0;/*@editable*/ text-align:left;/*@editable*/ vertical-align:middle;}/*** @tab Header* @section header link* @tip Set the styling for your emails header links. Choose a color that helps them stand out from your text.*/.headerContent a:link, .headerContent a:visited, /* Yahoo! Mail Override */ .headerContent a .yshortcuts /* Yahoo! Mail Override */{/*@editable*/ color:#EB4102;/*@editable*/ font-weight:normal;/*@editable*/ text-decoration:underline;}#headerImage{height:auto;max-width:600px;}/* ========== Body Styles ========== *//*** @tab Body* @section body style* @tip Set the background color and borders for your emails body area.*/#templateBody{/*@editable*/ background-color:#F4F4F4;/*@editable*/ border-top:1px solid #FFFFFF;/*@editable*/ border-bottom:1px solid #CCCCCC;}/*** @tab Body* @section body text* @tip Set the styling for your emails main content text. Choose a size and color that is easy to read.* @theme main*/.bodyContent{/*@editable*/ color:#505050;/*@editable*/ font-family:Helvetica;/*@editable*/ font-size:14px;/*@editable*/ line-height:150%;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px;/*@editable*/ text-align:left;}/*** @tab Body* @section body link* @tip Set the styling for your emails main content links. Choose a color that helps them stand out from your text.*/.bodyContent a:link, .bodyContent a:visited, /* Yahoo! Mail Override */ .bodyContent a .yshortcuts /* Yahoo! Mail Override */{/*@editable*/ color:#EB4102;/*@editable*/ font-weight:normal;/*@editable*/ text-decoration:underline;}.bodyContent img{display:inline;height:auto;max-width:560px;}/* ========== Footer Styles ========== *//*** @tab Footer* @section footer style* @tip Set the background color and borders for your emails footer area.* @theme footer*/#templateFooter{/*@editable*/ background-color:#F4F4F4;/*@editable*/ border-top:1px solid #FFFFFF;}/*** @tab Footer* @section footer text* @tip Set the styling for your emails footer text. Choose a size and color that is easy to read.* @theme footer*/.footerContent{/*@editable*/ color:#808080;/*@editable*/ font-family:Helvetica;/*@editable*/ font-size:10px;/*@editable*/ line-height:150%;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px;/*@editable*/ text-align:left;}/*** @tab Footer* @section footer link* @tip Set the styling for your emails footer links. Choose a color that helps them stand out from your text.*/.footerContent a:link, .footerContent a:visited, /* Yahoo! Mail Override */ .footerContent a .yshortcuts, .footerContent a span /* Yahoo! Mail Override */{/*@editable*/ color:#606060;/*@editable*/ font-weight:normal;/*@editable*/ text-decoration:underline;}/* /\/\/\/\/\/\/\/\/ MOBILE STYLES /\/\/\/\/\/\/\/\/ */ @media only screen and (max-width: 480px){/* /\/\/\/\/\/\/ CLIENT-SPECIFIC MOBILE STYLES /\/\/\/\/\/\/ */body, table, td, p, a, li, blockquote{-webkit-text-size-adjust:none !important;} /* Prevent Webkit platforms from changing default text sizes */ body{width:100% !important; min-width:100% !important;} /* Prevent iOS Mail from adding padding to the body *//* /\/\/\/\/\/\/ MOBILE RESET STYLES /\/\/\/\/\/\/ */#bodyCell{padding:10px !important;}/* /\/\/\/\/\/\/ MOBILE TEMPLATE STYLES /\/\/\/\/\/\/ *//* ======== Page Styles ======== *//*** @tab Mobile Styles* @section template width* @tip Make the template fluid for portrait or landscape view adaptability. If a fluid layout doesnt work for you, set the width to 300px instead.*/#templateContainer{max-width:600px !important;/*@editable*/ width:100% !important;}/*** @tab Mobile Styles* @section heading 1* @tip Make the first-level headings larger in size for better readability on small screens.*/h1{/*@editable*/ font-size:24px !important;/*@editable*/ line-height:100% !important;}/*** @tab Mobile Styles* @section heading 2* @tip Make the second-level headings larger in size for better readability on small screens.*/h2{/*@editable*/ font-size:20px !important;/*@editable*/ line-height:100% !important;}/*** @tab Mobile Styles* @section heading 3* @tip Make the third-level headings larger in size for better readability on small screens.*/h3{/*@editable*/ font-size:18px !important;/*@editable*/ line-height:100% !important;}/*** @tab Mobile Styles* @section heading 4* @tip Make the fourth-level headings larger in size for better readability on small screens.*/h4{/*@editable*/ font-size:16px !important;/*@editable*/ line-height:100% !important;}/* ======== Header Styles ======== */#templatePreheader{display:none !important;} /* Hide the template preheader to save space *//*** @tab Mobile Styles* @section header image* @tip Make the main header image fluid for portrait or landscape view adaptability, and set the images original width as the max-width. If a fluid setting doesnt work, set the image width to half its original size instead.*/#headerImage{height:auto !important;/*@editable*/ max-width:600px !important;/*@editable*/ width:100% !important;}/*** @tab Mobile Styles* @section header text* @tip Make the header content text larger in size for better readability on small screens. We recommend a font size of at least 16px.*/.headerContent{/*@editable*/ font-size:20px !important;/*@editable*/ line-height:125% !important;}/* ======== Body Styles ======== *//*** @tab Mobile Styles* @section body image* @tip Make the main body image fluid for portrait or landscape view adaptability, and set the images original width as the max-width. If a fluid setting doesnt work, set the image width to half its original size instead.*/#bodyImage{height:auto !important;/*@editable*/ max-width:560px !important;/*@editable*/ width:100% !important;}/*** @tab Mobile Styles* @section body text* @tip Make the body content text larger in size for better readability on small screens. We recommend a font size of at least 16px.*/.bodyContent{/*@editable*/ font-size:18px !important;/*@editable*/ line-height:125% !important;}/* ======== Footer Styles ======== *//*** @tab Mobile Styles* @section footer text* @tip Make the body content text larger in size for better readability on small screens.*/.footerContent{/*@editable*/ font-size:14px !important;/*@editable*/ line-height:115% !important;}.footerContent a{display:block !important;} /* Place footer social and utility links on their own lines, for easier access */}</style> </head> <body leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0"> <center> <table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable"> <tr> <td align="center" valign="top" id="bodyCell"> <!-- BEGIN TEMPLATE // --> <table border="0" cellpadding="0" cellspacing="0" id="templateContainer"> <tr> <td align="center" valign="top"> <!-- BEGIN PREHEADER // --> <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templatePreheader"> <tr> <td valign="top" class="preheaderContent" style="padding-top:10px; padding-right:20px; padding-bottom:10px; padding-left:20px;" mc:edit="preheader_content00"> Use this area to offer a short teaser of your emails content. Text here will show in the preview area of some email clients. </td> <!-- *|IFNOT:ARCHIVE_PAGE|* --> <td valign="top" width="180" class="preheaderContent" style="padding-top:10px; padding-right:20px; padding-bottom:10px; padding-left:0;" mc:edit="preheader_content01"> Email not displaying correctly?<br /><a href="*|ARCHIVE|*" target="_blank">View it in your browser</a>. </td> <!-- *|END:IF|* --> </tr> </table> <!-- // END PREHEADER --> </td> </tr> <tr> <td align="center" valign="top"> <!-- BEGIN HEADER // --> <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateHeader"> <tr> <td valign="top" class="headerContent"> <img src="https://cdn.flickeringmyth.com/wp-content/uploads/2019/11/Titans-s2-finale-2-600x400.jpg" style="max-width:600px;" id="headerImage" mc:label="header_image" mc:edit="header_image" mc:allowdesigner mc:allowtext /> </td> </tr> </table> <!-- // END HEADER --> </td> </tr> <tr> <td align="center" valign="top"> <!-- BEGIN BODY // --> <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateBody"> <tr> <td valign="top" class="bodyContent" mc:edit="body_content00"> <h1>Designing Your Template</h1> <h3>Creating a good-looking email is simple</h3> Customize your template by clicking on the style editor tabs up above. Set your fonts, colors, and styles. After setting your styling is all done you can click here in this area, delete the text, and start adding your own awesome content. </td> </tr> <tr> <td class="bodyContent" style="padding-top:0; padding-bottom:0;"> <img src="https://educacionprofesional.ing.uc.cl/wp-content/uploads/2020/01/200120_criptomonedas_nota-650x400.jpg" style="max-width:560px;" id="bodyImage" mc:label="body_image" mc:edit="body_image" mc:allowtext /> </td> </tr> <tr> <td valign="top" class="bodyContent" mc:edit="body_content01"> <h2>Styling Your Content</h2> <h4>Make your email easy to read</h4> After you enter your content, highlight the text you want to style and select the options you set in the style editor in the "<em>styles</em>" drop down box. Want to <a href="http://www.mailchimp.com/kb/article/im-using-the-style-designer-and-i-cant-get-my-formatting-to-change" target="_blank">get rid of styling on a bit of text</a>, but having trouble doing it? Just use the "<em>remove formatting</em>" button to strip the text of any formatting and reset your style. </td> </tr> </table> <!-- // END BODY --> </td> </tr> <tr> <td align="center" valign="top"> <!-- BEGIN FOOTER // --> <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateFooter"> <tr> <td valign="top" class="footerContent" mc:edit="footer_content00"> <a href="*|TWITTER:PROFILEURL|*">Follow on Twitter</a>&nbsp;&nbsp;&nbsp;<a href="*|FACEBOOK:PROFILEURL|*">Friend on Facebook</a>&nbsp;&nbsp;&nbsp;<a href="*|FORWARD|*">Forward to Friend</a>&nbsp; </td> </tr> <tr> <td valign="top" class="footerContent" style="padding-top:0;" mc:edit="footer_content01"> <em>Copyright &copy; *|CURRENT_YEAR|* *|LIST:COMPANY|*, All rights reserved.</em> <br /> *|IFNOT:ARCHIVE_PAGE|* *|LIST:DESCRIPTION|* <br /> <br /> <strong>Our mailing address is:</strong> <br /> *|HTML:LIST_ADDRESS_HTML|* *|END:IF|* </td> </tr> <tr> <td valign="top" class="footerContent" style="padding-top:0;" mc:edit="footer_content02"> <a href="*|UNSUB|*">unsubscribe from this list</a>&nbsp;&nbsp;&nbsp;<a href="*|UPDATE_PROFILE|*">update subscription preferences</a>&nbsp; </td> </tr> </table> <!-- // END FOOTER --> </td> </tr> </table> <!-- // END TEMPLATE --> </td> </tr> </table> </center> </body></html>',
                "CustomID": "TestEmail"
                
                }
            ]
            })
            request
            .then((result) => {
                console.log(result.body)
            })
            .catch((err) => {
                console.log(err.statusCode)
            })
        }


        if (tokens.length > 0) {
            // Send notifications to all tokens.
            const response = await admin.messaging().sendToDevice(tokens, payload);
            console.log('Notifications have been sent');
        }

        if (!campaign) {
            return res.status(404).send({
                message: "campaign not found with id " + req.params.campaignId
            });
        }



        res.send(campaign);
    } catch (err) {
        console.log("error: ",err)
        if (err.kind === 'ObjectId') {
            return res.status(404).send({
                message: "campaign not found with id " + req.params.campaignId
            });
        }
        return res.status(500).send({
            message: "Error retrieving campaign with id " + req.params.campaignId
        });
    }

};

// Update a campaign identified by the campaignId in the request
exports.update = (req, res) => {

    // Find campaign and update it with the request body
    Campaign.findByIdAndUpdate(req.params.campaignId, {
        title: req.body.title || "Untitled campaign",
        channels: req.body.channels,
        startdate: req.body.startdate,
        enddate: req.body.enddate,
        audience: req.body.audience,
        message: req.body.message
    }, { new: true })
        .then(campaign => {
            if (!campaign) {
                return res.status(404).send({
                    message: "campaign not found with id " + req.params.campaignId
                });
            }
            res.send(campaign);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({
                    message: "campaign not found with id " + req.params.campaignId
                });
            }
            return res.status(500).send({
                message: "Error updating campaign with id " + req.params.campaignId
            });
        });
};

// Delete a campaign with the specified campaignId in the request
exports.delete = (req, res) => {
    Campaign.findByIdAndRemove(req.params.campaignId)
        .then(campaign => {
            if (!campaign) {
                return res.status(404).send({
                    message: "campaign not found with id " + req.params.campaignId
                });
            }
            res.send({ message: "campaign deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return res.status(404).send({
                    message: "campaign not found with id " + req.params.campaignId
                });
            }
            return res.status(500).send({
                message: "Could not delete campaign with id " + req.params.campaignId
            });
        });
};