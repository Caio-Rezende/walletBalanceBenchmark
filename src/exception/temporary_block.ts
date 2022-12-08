import { ABORTABLE_EXCEPTION } from "./abortable";

export class TEMPORARY_BLOCK_EXCEPTION extends ABORTABLE_EXCEPTION {
  message: string = "TEMPORARY BLOCK";
}
