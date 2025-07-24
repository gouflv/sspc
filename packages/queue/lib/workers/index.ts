import { captureWorker } from "./capture"
import { compressWorker } from "./compress"
import { rootWorker } from "./root"

const Workers = { rootWorker, captureWorker, compressWorker }
export default Workers
