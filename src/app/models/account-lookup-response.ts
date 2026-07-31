import { BankAccount } from './bank-account';
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
export interface AccountLookupResponse {

    message: string;

    accounts: BankAccount[];

}