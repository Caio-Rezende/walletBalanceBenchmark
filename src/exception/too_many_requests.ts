import { ABORTABLE_EXCEPTION } from "./abortable";

export class TOO_MANY_REQUESTS_EXCEPTION extends ABORTABLE_EXCEPTION {
  message: string = "TOO MANY REQUESTS";
}
