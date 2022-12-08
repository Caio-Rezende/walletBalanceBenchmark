import { ABORTABLE_EXCEPTION } from "./abortable";

export class NOT_OK_EXCEPTION extends ABORTABLE_EXCEPTION {
  message: string = "NOT OK";
}
