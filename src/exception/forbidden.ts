import { ABORTABLE_EXCEPTION } from "./abortable";

export class FORBIDDEN_EXCEPTION extends ABORTABLE_EXCEPTION {
  message: string = "FORBIDDEN";
}
