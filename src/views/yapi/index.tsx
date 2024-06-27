import React, { useRef, useState, useEffect, useCallback } from "react"
import { Card, Input, Space, Button, message } from "antd"
import "./index.less"
import axios from "axios"

import { TS_TYPE_MAP } from '@/views/yapi/constants'
import hljs from 'highlight.js/lib/core';
import highTS from 'highlight.js/lib/languages/typescript';
import 'highlight.js/styles/dark.css'
hljs.registerLanguage('typescript', highTS);

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
    const requestCodeRef = useRef<HTMLElement>(null)
    const responseCodeRef = useRef<HTMLElement>(null)
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

    /**
     * 填充缩进
     * @param num 数量
     * @param flag 
     */
    const fillIndent = (num: number = 1, flag: string = '    ') => {
        return new Array(num).fill(flag).join('')
    }
    const getFormatObj = (obj: any, requiredArr: string[] = [], recursionCount: number = 1) => {
        let formatObj: string = ''
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const { type = '', description, enumDesc } = obj[key]
                if (['array', 'object'].includes(type)) {
                    let properties: any
                    switch (type) {
                        case 'array':
                            properties = obj[key].items.properties
                            break
                        case 'object':
                            properties = obj[key].properties
                            break
                        default:
                            properties = {}
                            break
                    }
                    formatObj += `
${fillIndent(recursionCount)}/** ${description} */
${fillIndent(recursionCount)}${key}: ${getFormatObj(properties, [], recursionCount + 1)}`
                    continue
                }
                formatObj += `
${fillIndent(recursionCount)}/** ${description.replaceAll('\n', ' ') + (enumDesc ? ` ${enumDesc.replaceAll('\n', ' ')}` : '')} */
${fillIndent(recursionCount)}${String(key)}${requiredArr.length ? (requiredArr.includes(key) ? ':' : '?:') : ':'} ${TS_TYPE_MAP[type]}`
            }
        }
        formatObj = `{${formatObj}
${fillIndent(recursionCount - 1)}}`
        return formatObj
    }

    const handleToSearch = useCallback(() => {
        if (!requestUrl || !requestQuery) {
            return
        }
        instance
            .get(import.meta.env.DEV ? `/api?id=${requestQuery}` : `${requestUrl}?id=${requestQuery}`)
            .then((res: any) => {
                const { data } = res.data
                const { req_query, req_body_other, res_body, errmsg } = data || {}
                if (errmsg) {
                    message.error(errmsg)
                    return
                }
                // GET请求参数
                if (req_query && req_query.length) {
                    let formatObj: string = ''
                    for (const item of req_query) {
                        const { desc, name, required } = item
                        formatObj += `${desc ? `
    /** ${desc} */` : ''}
    ${name}${required == 0 ? '?:' : ':'} string
`
                    }
                    formatObj = `{${formatObj}}`
                    const requestCode = hljs.highlight(formatObj, { language: 'typescript' }).value;
                    requestCodeRef.current!.innerHTML = requestCode
                }
                // POST 请求参数
                if (req_body_other && req_body_other.length) {
                    const { properties: _req_body_other, required: requestRequired } = JSON.parse(req_body_other)
                    const formatObj = getFormatObj(_req_body_other, requestRequired)
                    const requestCode = hljs.highlight(formatObj, { language: 'typescript' }).value;
                    requestCodeRef.current!.innerHTML = requestCode
                }
                // 响应数据
                const { properties: _res_body } = JSON.parse(res_body)
                if (_res_body) {
                    const formatObj = getFormatObj(_res_body)
                    const responseCode = hljs.highlight(formatObj, { language: 'typescript' }).value;
                    responseCodeRef.current!.innerHTML = responseCode
                }
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
            <Card style={{ width: '100%', height: 'calc(100vh - 230px)', marginTop: 10 }} classNames={{
                body: "yapi-card-body",
            }}>
                <Card.Grid hoverable={false} className="yapi-card-grid grid-first">
                    <pre>
                        <code ref={requestCodeRef} />
                    </pre>
                </Card.Grid>
                <Card.Grid hoverable={false} className="yapi-card-grid grid-second">
                    <pre>
                        <code ref={responseCodeRef} />
                    </pre>
                </Card.Grid>
            </Card>
        </section>
    )
}

export default Yapi