import axios from 'axios'
import { message } from 'antd'

const baseURL: string = '/yapi'

const instance = axios.create({
    baseURL,
    timeout: 10000,
})

instance.interceptors.request.use((config: any) => {
    return config
}, (error) => {
    return Promise.reject(error)
})

instance.interceptors.response.use((response: any) => {
    const { errmsg, errcode, data } = response.data
    const code = errcode || 200
    if (code === 200) {
        return Promise.resolve(data)
    } else {
        message.error({ content: errmsg, duration: 2 })
        return Promise.reject(response.data)
    }
}, (error) => {
    const { message } = error
    message.error({ content: message, duration: 2 })
    return Promise.reject(error)
})

export default instance