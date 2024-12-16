import React, { useRef, useState, useEffect, useCallback } from "react"
import { Card, Input, Space, Button, message } from "antd"
import "./index.less"
import { TS_TYPE_MAP } from '@/views/yapi/constants'
import instance from "@/api/yapi/index"
import hljs from 'highlight.js/lib/core';
import highTS from 'highlight.js/lib/languages/typescript';
import 'highlight.js/styles/monokai-sublime.min.css'
hljs.registerLanguage('typescript', highTS);

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
        hljs.highlightElement(requestCodeRef.current!)
        hljs.highlightElement(responseCodeRef.current!)
    }, [requestCodeRef, responseCodeRef])

    /**
     * 填充缩进
     * @param num 数量
     * @param flag 
     */
    const fillIndent = (num: number = 1, flag: string = '    ') => {
        return new Array(num).fill(flag).join('')
    }

    /**
     * 移除换行符
     * @param str 
     * @param fillSymbol 
     * @returns 
     */
    const removeLineBreak = (str: string, fillSymbol:string = ' ') => {
        return str.replaceAll(/(\r\n|\r|\n)/g, fillSymbol)
    }

    /**
     * 填充格式化代码
     * @param ref 
     * @param code 
     */
    const setCode = (ref: React.RefObject<HTMLElement>, code: string) => {
        const requestCode = hljs.highlight(code, { language: 'typescript' }).value;
        ref.current!.innerHTML = requestCode
    }

    const getFormatObj = useCallback((obj: any, requiredArr: string[] = [], recursionCount: number = 1, type: string = '', sonType: string = '') => {
        console.log('obj :>> ', obj, type);
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
                    formatObj += `\n${description ? `${ fillIndent(recursionCount) }/** ${removeLineBreak(description)} */\n` : ''}${fillIndent(recursionCount)}${key}: ${getFormatObj(properties, [], recursionCount + 1, type, TS_TYPE_MAP[obj[key].items.type])}`
                    continue
                }
                formatObj += `\n${(enumDesc || description) ? `${fillIndent(recursionCount)}/** ${removeLineBreak(description) + (enumDesc ? ` ${removeLineBreak(enumDesc)}` : '')} */\n` : ''}${fillIndent(recursionCount)}${String(key)}${requiredArr.length ? (requiredArr.includes(key) ? ':' : '?:') : ':'} ${TS_TYPE_MAP[type]}`
            }
        }
      // formatObj = `${formatObj ? `{${formatObj}\n}${fillIndent(recursionCount - 1)}` : sonType}${type === 'array' ? '[]' : ''}`
        formatObj = formatObj ? `{${formatObj}\n${fillIndent(recursionCount - 1)}}${type === 'array' ? '[]' : ''}` : `${sonType}${type === 'array' ? '[]' : ''}`
        return formatObj
    }, [])

    const handleToSearch = useCallback(() => {

        if (!requestUrl || !requestQuery) {
            return
        }
        
        instance
            .get(`?id=${requestQuery}`)
            .then((data: any) => {
                const { req_query, req_body_form, req_body_other, res_body } = data || {}

                setCode(requestCodeRef, '')
                // GET请求参数
                if (req_query && req_query.length) {
                    let formatObj: string = ''
                    for (let i = 0; i < req_query.length; i++) {
                        const { desc, name, required } = req_query[i];
                        formatObj += `${desc ? `\n${fillIndent(1)}/** ${removeLineBreak(desc)} */` : ''}\n${fillIndent(1)}${name}${required == 0 ? '?:' : ':'} string${i == req_query.length - 1 ? '\n' : ''}`
                    }
                    setCode(requestCodeRef, `{${formatObj}}`)
                }

                // POST 请求参数
                if (req_body_other && req_body_other.length) {
                    const { properties: _req_body_other, required: requestRequired } = JSON.parse(req_body_other)
                    const formatObj = getFormatObj(_req_body_other, requestRequired)
                    setCode(requestCodeRef, formatObj)
                }

                // POST 请求参数（文件）
                if (req_body_form && req_body_form.length) {
                    let formatObj: string = ''
                    for (let i = 0; i < req_body_form.length; i++) {
                        const { desc, name, required, type } = req_body_form[i];
                        formatObj += `${desc ? `\n${fillIndent(1)}/** ${removeLineBreak(desc)} */` : ''}\n${fillIndent(1)}${name}${required == 0 ? '?:' : ':'} ${TS_TYPE_MAP[type] || 'string'}${i == req_body_form.length - 1 ? '\n' : ''}`
                    }
                    setCode(requestCodeRef, `{${formatObj}}`)
                }

                // 响应数据
                const { properties: _res_body } = JSON.parse(res_body)
                if (_res_body) {
                    const formatObj = getFormatObj(_res_body)
                    setCode(responseCodeRef, '')
                    setCode(responseCodeRef, formatObj)
                }
            })
          .catch((err: any) => {
            if (err?.errcode === 40011 && cookieValue) {
                setCookieValue('')
                message.error('Cookie已过期，请重新设置')
              }
            })
    }, [requestUrl, requestQuery, getFormatObj, cookieValue])
  
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