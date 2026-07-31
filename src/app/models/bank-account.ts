import { AccountType } from "./account-type";

/**
 * Represents the response from the account lookup API.
 * 
 * Example response:
 * {
  "message": "...",
  "accounts": [
    {
      "id": "...",
      "accountHolder": "John Smith",
      "creationDate": "...",
      "accountType": "SAVINGS",
      "balance": 1000
    }
  ]
}
*/
export interface BankAccount {
    id: string;
    accountHolder: string;
    accountType: AccountType;
    creationDate: string;
    balance: number;
}
