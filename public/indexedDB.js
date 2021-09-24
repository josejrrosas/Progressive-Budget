let db;
// Create a new db request for a "budget" database.
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = (e) => {
  const db = e.target.result;
  db.createObjectStore("transaction", { autoIncrement: true });
};

request.onsuccess = (e) => {
  db = e.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = (e) => {
  console.log(`Woops! ${e.target.errorCode}`);
};

function checkDatabase() {
  const transaction = db.transaction(["transaction"], "readwrite");
  // access your transaction object
  const store = transaction.objectStore("transaction");
  const getAll = store.getAll();

  // If the request was successful
  getAll.onsuccess = function () {
    // If there are items in the store, we need to bulk add them when we are back online
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          // If our returned response is not empty
          if (res.length !== 0) {
            // Open another transaction to transaction with the ability to read and write
            transaction = db.transaction(['transaction'], 'readwrite');

            // Assign the current store to a variable
            const currentStore = transaction.objectStore('transaction');

            // Clear existing entries because our bulk add was successful
            currentStore.clear();
            console.log('Clearing store 🧹');
          }
        });
    }
  };
}

const saveRecord = (record) => {
    // Open a transaction on your transaction db
      const transaction = db.transaction(["transaction"], "readwrite");
    
      const store = transaction.objectStore("transaction");
    
      store.add(record);
    };
// Listen for app coming back online
window.addEventListener("online", checkDatabase);
