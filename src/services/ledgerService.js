import { getCollection, setCollection } from "./api";

export function addLedgerEntries(entries) {
  const ledger = getCollection("ledger");
  const stamped = entries.map((e, i) => ({
    id: `L-${9000 + ledger.length + i + 1}`,
    date: new Date().toISOString().slice(0, 16).replace("T", " "),
    ...e,
  }));
  setCollection("ledger", [...stamped, ...ledger]);
  return stamped;
}

export async function listLedger() {
  return getCollection("ledger");
}
