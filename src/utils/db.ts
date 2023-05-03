import { openDB } from "idb";

const DATABASE_NAME = "myDatabase";
const DATABASE_VERSION = 1;

async function openDatabase(storeName: string) {
  return await openDB(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    },
  });
}

export async function setData(storeName: string, key: string, value: any) {
  const db = await openDatabase(storeName);

  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  await store.put(value, key);
  await tx.done;
}

export async function getData(storeName: string, key: string): Promise<any> {
  const db = await openDatabase(storeName);

  return await db.get(storeName, key);
}