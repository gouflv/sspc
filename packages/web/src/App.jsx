import { defineComponent, onMounted, onUnmounted, ref, watch } from "vue"
import { useRequest } from "./api"

export default defineComponent({
  setup() {
    const captureParams = ref()

    const { error, loading, data } = useRequest(captureParams)

    function onSubmit(formData) {
      const { url, format } = formData

      const pages = [{ url, name: "example" }]

      if (format === "image") {
        captureParams.value = {
          pages,
          viewportWidth: 1280,
          captureFormat: "jpeg",
          quality: 80,
        }
      } else if (format === "pdf") {
        captureParams.value = {
          pages,
          captureFormat: "pdf",
          pdfFormat: "A4",
          pdfCompress: false,
        }
      }
    }

    return () => (
      <div class="p-2 bg-gray-100 min-h-screen flex flex-col space-y-4">
        <Form loading={loading.value} onSubmit={onSubmit} />

        {error.value && (
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm text-red-700">
            <h3 class="font-bold mb-1">错误信息</h3>
            <p class="text-sm">{error.value.message || String(error.value)}</p>
          </div>
        )}

        {data.value && <Result data={data.value} />}
      </div>
    )
  },
})

const Form = defineComponent({
  props: {
    loading: Boolean,
  },
  emits: ["submit"],
  setup(props, { emit }) {
    const url = ref("")
    const format = ref("image")
    const countdown = ref(30)
    let timer = null

    const handleSubmit = (e) => {
      e.preventDefault()
      emit("submit", {
        url: url.value,
        format: format.value,
      })
    }

    watch(
      () => props.loading,
      (isLoading) => {
        if (isLoading) {
          // Reset and start countdown
          countdown.value = 30
          clearInterval(timer)
          timer = setInterval(() => {
            countdown.value = Math.max(0, countdown.value - 1)
          }, 1000)
        } else {
          // Clear timer when loading is complete
          clearInterval(timer)
        }
      },
    )

    // Clean up timer when component unmounts
    onUnmounted(() => {
      clearInterval(timer)
    })

    return () => (
      <div class="p-6 bg-white rounded-lg shadow-md">
        <header class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-800">页面抓取</h2>
          <div class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md border border-gray-200">
            API: http://10.0.28.121:3001/jobs/urgent
          </div>
        </header>
        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label
              for="url"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              页面地址:
            </label>
            <input
              id="url"
              type="url"
              value={url.value}
              onInput={(e) => (url.value = e.target.value)}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="flex space-x-10 mb-4">
            <div class="flex items-center text-sm">
              <label class="mr-2 font-medium text-gray-700">示例页面:</label>
              <div class="flex space-x-2">
                <div
                  class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md border border-gray-200 cursor-pointer"
                  onClick={() => {
                    url.value =
                      "https://jcxygl.chaoxing.com/portrait/preview/html/pdf-layout.html"
                  }}
                >
                  打印排版示例
                </div>
                <div
                  class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md border border-gray-200 cursor-pointer"
                  onClick={() => {
                    url.value =
                      "https://jcxygl.chaoxing.com/portrait/preview/7/?year=2024-2025&term=2&studentNo=cxxx26"
                  }}
                >
                  德育画像
                </div>
              </div>
            </div>

            <div class="flex items-center">
              <label class="block text-sm font-medium text-gray-700 mr-2">
                输出格式:
              </label>
              <div class="flex items-center space-x-4">
                <div class="flex items-center">
                  <input
                    id="format-image"
                    type="radio"
                    name="format"
                    value="image"
                    checked={format.value === "image"}
                    onChange={() => (format.value = "image")}
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label for="format-image" class="ml-2 text-sm text-gray-700">
                    图片
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    id="format-pdf"
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={format.value === "pdf"}
                    onChange={() => (format.value = "pdf")}
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label for="format-pdf" class="ml-2 text-sm text-gray-700">
                    PDF(A4)
                  </label>
                </div>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={props.loading}
            class={`bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
              props.loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {props.loading ? `处理中...(${countdown.value}s)` : "提交"}
          </button>
        </form>
      </div>
    )
  },
})

const Result = defineComponent({
  props: {
    data: Object, // Blob
  },
  setup(props) {
    const url = ref()
    onMounted(() => {
      url.value = URL.createObjectURL(props.data)
    })
    onUnmounted(() => {
      URL.revokeObjectURL(url.value)
    })

    return () => (
      <div class="flex-1 flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
        <iframe class="flex-1 w-full h-full" src={url.value} />
      </div>
    )
  },
})
