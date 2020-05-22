import * as functions from 'firebase-functions';
import * as moment from 'moment';
import { QuerySnapshot, QueryDocumentSnapshot, DocumentSnapshot } from '@google-cloud/firestore';
const admin = require('firebase-admin');
admin.initializeApp();
const fs = require("fs");
const db = admin.firestore();

// Properly Terminating a Cloud functions: (https://www.youtube.com/watch?v=7IkUgCLr5oA)
// Background triggers: return a promise.

// https://firebase.google.com/docs/functions/http-events
// Important: Make sure that all HTTP functions terminate properly. 
// By terminating functions correctly, you can avoid excessive charges from 
// functions that run for too long. 
// Terminate HTTP functions with res.redirect(), res.send(), or res.end().

    // Use local DB only else commands could go to live DB if 
    // credentials are available via export GOOGLE_APPLICATION_CREDENTIALS="/Users/michael/Downloads/ws-ionic-d-firebase-adminsdk-dr73f-bfd41e1040.json"
    // db.settings({
    //   host: "localhost:8080",
    //   ssl: false
    // });



exports.cfSyncRecordPropsToStudent = functions.https.onCall((data, context) => {
  const id = data.id
  const fname = data.fname
  const lname = data.lname
  const dob = data.dob
  const gender = data.gender
  const grade = data.grade
  const race = data.race
  const fatherEmail = data.fatherEmail
  const motherEmail = data.motherEmail
  const recordId = data.recordId
  const docRef = db.collection("students").doc(`${id}`);
  const obj = {
    id,
    fname,
    lname,
    dob,
    gender,
    grade,
    race,
    fatherEmail,
    motherEmail,               
    recordId
  }
  if(!context.auth) { 
    console.log('Authentication Required!');
    return { message: 'Authentication Required!', code: 401 };
  }
   return docRef.update(obj)
   .then((d: any) => {
    return { // Pass data to the client
      obj,
      dataFromThen: d,
    };
  })
  .catch((error: Error) => {
    console.error(error);
    return {error};
    })
});
  
export const importJSON = functions.https.onRequest((request, response) => {
    const wsData = fs.readFileSync('ws.json');
    const promises:Promise<any>[] =[];
    new Promise((resolve, reject) => {
      resolve(wsData);
    })
    .then((v:any) => {
      const arr = JSON.parse('[' + v + ']');
      let users;
      let financials;
      let arrUsers:any[] =[];
      let arrFinancials:any[] =[];
      arr.forEach((element:any) => {
        financials = element["collection:financials"];
        arrFinancials = convertMapToArray(financials);
        users = element["collection:users"];
        arrUsers = convertMapToArray(users);
      });
      arrUsers.forEach(element => {
        const p1 =  db.collection('users').doc(element['uid']).set(element)
        promises.push(p1);
      });
      arrFinancials.forEach(element => {
        const p2 =  db.collection('financials').doc().set(element)
        .then((doc:DocumentSnapshot) => console.log(doc));
        promises.push(p2);
      });
      return Promise.all(promises).then(x => {
        response.status(200).send(`Imported JSON`);
      })
      .catch((error: Error) => {
        console.error(error);
        response.status(500).send(error)
      })
    
    })
    .catch((error: Error) => {
        console.error(error);
        response.status(500).send(error)
      })
  });


    export const read = functions.https.onRequest((request, response) => {
      const promises: Promise<any>[] = [];
      const p1 = db.collection('users').get().then((q: QuerySnapshot) => {
        q.forEach((doc: DocumentSnapshot) => {
          const d = doc.data()
          if(d) { console.log(d.email);}
        })
      });
      promises.push(p1);
      const p2 = db.collection('financials').get().then((q: QuerySnapshot) => {
        q.forEach((doc: DocumentSnapshot) => {
          const d = doc.data()
          if(d) { console.log(d.childFirstName);}
        })
      });
      promises.push(p2);
      return Promise.all(promises).then((data) => {
        console.log(`MD: data`, data);
        response.status(200).send(`Data: ${JSON.stringify(data)}`);
      }).catch((error: Error) => {
        console.error(error);
        response.status(500).send(error)
        })
    });

    export const createStudentsCollection = functions.https.onRequest((request, response) => {
    // console.log(`MD: request`, request);
      const promises: Promise<any>[] = [];
      let totalChildren: number = 0;
      let totalStudents: number = 0;
      const p1 = db.collection('records').get()
      // promises.push(p1)
      p1.then((querySnapshot: QuerySnapshot) => {
        querySnapshot.forEach((doc: QueryDocumentSnapshot) => {
          const recordId = doc.id;
          const _fatherEmail = doc.data().fatherEmail;
          const _motherEmail = doc.data().motherEmail;
          const children = doc.data().children;

          if(children) {
            const childrenArr = convertMapToArray(children);
            childrenArr.forEach(child => {
              totalChildren ++;
              const momentDate = moment(child.dob._seconds * 1000).toDate();
              // Docs in records collection will not contain children with this version of the app.
              // Optionally delete children map from records from old version.
              const childObj = {
                recordId,
                fatherEmail: _fatherEmail,
                motherEmail: _motherEmail,
                ...child,
                dob: momentDate,
                active: true,
              }
              const p2 = db.collection('students').doc(child.id).set(childObj)
              promises.push(p2);
              p2.then(()=>{
                totalStudents ++;
              })
            }); 

          } // if(children)
        });
        Promise.all(promises).then((data) => {
          // Console logs will show in Firebase console's Functions Logs
          // The data in .send() will show in the command line when 
          // executing curl https://us-central1-cf-poc-76ccd.cloudfunctions.net/studentsConfig
          // and will show in the browser when pointing to https://us-central1-cf-poc-76ccd.cloudfunctions.net/studentsConfig
          response.status(200)
            .send(`Completed Creating students top-level collection | Total children:  ${totalChildren} | Total students:  ${totalStudents} | Data length: ${data.length}`);
        }).catch((error: Error) => {
          console.error(error);
          response.status(500).send(error)
         })
      }).catch((error: Error) => {
          console.error(error);
          response.status(500).send(error)
      })
    })

    export const restructFinancials = functions.https.onRequest((request, response) => {
      let totalFinancialDocsUnderStudents: number = 0;
      const promises: Promise<any>[] = [];
      db.collection('financials').get()
      .then((qs: QuerySnapshot) => {
        qs.forEach((fDoc: QueryDocumentSnapshot) => {
        // A way to filter out the unwanted properties and keep desired ones.
        // See https://codeburst.io/use-es2015-object-rest-operator-to-omit-properties-38a3ecffe90
        const {childFirstName, childLastName, fatherEmail, motherEmail, grade, ...keep} = fDoc.data();
        const p1 = db.collection('students').doc(fDoc.id).collection('financials').doc(fDoc.id).set(keep);
        promises.push(p1);
        p1.then(() => {
          // Go to the top-level 'financials' collection and 
          // get all the docs from each subcollection.
          const collections = ['extendedCareCharges', 
                                'extendedCarePayments',
                                'lunchCharges', 
                                'lunchPayments', 
                                'miscCharges', 
                                'miscPayments', 
                                'tuitionCharges', 
                                'tuitionPayments'];
           collections.forEach(collection => {
            const p2 = db.collection('financials').doc(fDoc.id).collection(collection).get();
            promises.push(p2);
            p2.then((qss: QuerySnapshot) => {
              if (!qss.empty) {
                qss.forEach((d: QueryDocumentSnapshot) => {
                  let nData;
                   // Handle long dates that came from charge split memos.
                  if (d.data().memo.includes('Due: ')) {
                    const memoDate = d.data().memo.slice(9); // Strip Due: Day (with space at end)
                    const formattedMemoDate = moment(memoDate).format('L');
                    nData = {
                      ...d.data(),
                      date: moment(d.data().date._seconds * 1000).toDate(),
                      memo: `Due ${formattedMemoDate}`
                    }
                  } else {
                    nData = {
                      ...d.data(),
                      date: moment(d.data().date._seconds * 1000).toDate(),
                    }
                  }
                  // Lastly, add the 'financials' subcollection and its included subcollections to 
                  // the appropriate doc under the  top-level 'students' collection. 
                  const p3 = db.collection('students').doc(fDoc.id).collection('financials').doc(fDoc.id).collection(collection).doc(d.id).set(nData);
                  p3.then(()=> totalFinancialDocsUnderStudents++);
                  promises.push(p3)
                });
              }
            })
           })
          }).catch((err: Error) => console.error(err))
        })
        Promise.all(promises).then((data) => {
          response.status(200)
          .send(`Completed Financials. Total Financial Docs Under Students: ${totalFinancialDocsUnderStudents} | Data length: ${data.length}`);
        }).catch((error: Error) => {
          console.error(error);
          response.status(500).send(error)
         })
      }).catch((err: Error) => console.error(err))
    });

    export const studentsFixDate = functions.https.onRequest((request, response) => {
      const promises: Promise<any>[] = [];
      const pa = db.collection('students').get()
      promises.push(pa);
      pa.then((qs: QuerySnapshot) => {
        qs.forEach((sdoc: QueryDocumentSnapshot) => {
          const collections = ['extendedCareCharges', 
                                'extendedCarePayments',
                                'lunchCharges', 
                                'lunchPayments', 
                                'miscCharges', 
                                'miscPayments', 
                                'tuitionCharges', 
                                'tuitionPayments'];
           collections.forEach(collection => {
            const p2 = db.collection('students').doc(sdoc.id).collection('financials').doc(sdoc.id).collection(collection).get();
            promises.push(p2);
            p2.then((qss: QuerySnapshot) => {
              let formattedMemoDate: any;
              if (!qss.empty) {
                qss.forEach((d: QueryDocumentSnapshot) => {
                   // Handle long dates that came from charge split memos.
                  if (d.data().memo.includes('Due: ')) {
                    const memoDate = d.data().memo.slice(9); // Strip Due: Day (with space at end)
                    formattedMemoDate = moment(memoDate).format('L');
                  } 
                  const p3 = db.collection('students').doc(sdoc.id).collection('financials').doc(sdoc.id)
                    .collection(collection).doc(d.id)
                    .update({ memo: `Due ${formattedMemoDate}`});
                  promises.push(p3)
                });
              }
       
           }).catch((err: Error) => console.error(err))
          });
        })
        Promise.all(promises).then((data) => {
          response.status(200).send(`Fixed date.  data returned: ${data}`);
        }).catch((error: Error) => { // Use .catch so that promise is not floating.
          console.error(error);
          response.status(500).send(error)
         })
      }).catch((err: Error) => console.error(err))
    })

  function convertMapToArray(map: any) {
    const keys = Object.keys(map)
    return keys.map(key => map[`${key}`])
  }

