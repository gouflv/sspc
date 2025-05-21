import axios from "axios"
import { ref, toValue, watch } from "vue"

const API = "http://10.0.28.121:3001/jobs/urgent"
// const API = "http://localhost:3001/jobs/urgent"

/**
 * @param {QueueCaptureParamsType} params
 */
export function useRequest(params) {
  const error = ref()
  const loading = ref(false)
  const data = ref()

  async function fetch() {
    try {
      error.value = null
      loading.value = true
      data.value = null

      const res = await axios.post(API, toValue(params), {
        responseType: "blob",
        timeout: 1000 * 60,
      })
      console.log("fetch", res.data)
      data.value = res.data
    } catch (err) {
      console.error(err)
      error.value = err
    } finally {
      loading.value = false
    }
  }

  watch(
    () => toValue(params),
    () => fetch(),
  )

  return {
    error,
    loading,
    data,
  }
}
