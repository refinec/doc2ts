import React, { useState, useEffect, useCallback } from "react"
import { Card, Input, Space, Button, message } from "antd"
import "./index.less"
import axios from "axios"

const instance = axios.create({
    baseURL: import.meta.env.DEV ? import.meta.env.BASE_URL : '',
    timeout: 10000,
    // headers: {
    //     'X-Custom-Header': 'foobar'
    // }
});

const Yapi: React.FC = () => {
    const [cookieValue, setCookieValue] = useState<string>("")
    const [requestUrl, setRequestUrl] = useState<string>()
    const [requestQuery, setRequestQuery] = useState<string>()

    const handleSetCookieValue = useCallback(() => {
        cookieValue.split(";").forEach(item => {
            const [key, value] = item.split("=")
            document.cookie = `${key}=${value}; `
        })
        if (!document.cookie) {
            window.localStorage.setItem('cookie', cookieValue)
        }
    }, [cookieValue])

    const handleSetRequestUrl = useCallback((v: string) => {
        window.localStorage.setItem('requestUrl', v)
    }, [])

    /**
     * 获取 Cookie
     * @returns 
     */
    const setCookies = () => {
        const { cookie } = document
        if (cookie) {
            setCookieValue(cookie)
            return
        }
        const cookieValue = window.localStorage.getItem('cookie')
        if (cookieValue) {
            setCookieValue(cookie)
            return
        }
    }
    const setReUrl = () => {
        const requestUrl = window.localStorage.getItem('requestUrl')
        if (requestUrl) {
            setRequestUrl(requestUrl)
            return
        }
    }
    useEffect(() => {
        setCookies()
        setReUrl()
    }, [])

    const handleToSearch = useCallback(() => {
        if (!requestUrl || !requestQuery) {
            return
        }
        instance
            .get(import.meta.env.DEV ? `/api?id=${requestQuery}` : `${requestUrl}?id=${requestQuery}`)
            .then(res => {
                const { data } = res.data
                const { req_query, res_body } = data
                const { properties } = JSON.parse(res_body)
                console.log(req_query, properties)
                
            })
            .catch(err => {
                message.error(err?.message || "请求失败")
            })
    }, [requestUrl, requestQuery])
    return (
        <section>
            <Card style={{ width: '100%' }}>
                <Space.Compact style={{ width: '100%' }}>
                    <Input addonBefore={"Cookie:"} placeholder="请设置Cookie" variant="filled" value={cookieValue} onChange={(e) => setCookieValue(e.target.value)} allowClear onPressEnter={handleSetCookieValue} />
                    <Button type="primary" onClick={handleSetCookieValue}>设置</Button>
                </Space.Compact>
            </Card>
            <Card style={{ width: '100%', marginTop: 10 }}>
                <Space.Compact style={{ width: '100%' }}>
                    <Input addonBefore={"请求接口:"} placeholder="请设置实际请求接口" variant="filled" value={requestUrl} onChange={(e) => handleSetRequestUrl(e.target.value)} allowClear />
                    <Input placeholder="?id=xxx" variant="filled" value={requestQuery} onChange={(e) => setRequestQuery(e.target.value)} allowClear />
                    <Button disabled={!requestUrl || !requestQuery} type="primary" onClick={handleToSearch}>搜索</Button>
                </Space.Compact>
                {requestUrl && <div className="url-tip">{`${requestUrl}?id=${requestQuery}`}</div>}
            </Card>
            <Card style={{ width: '100%', marginTop: 10 }}></Card>
        </section>
    )
}

export default Yapi