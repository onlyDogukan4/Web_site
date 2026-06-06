/** Vercel serverless handler'ları için minimal req/res mock */
export function createMockReq({ method = 'POST', body = {}, headers = {}, query = {} } = {}) {
    return {
        method,
        body,
        headers,
        query,
        socket: { remoteAddress: '127.0.0.1' },
    };
}

export function createMockRes() {
    const res = {
        statusCode: 200,
        headers: {},
        body: null,
        ended: false,
    };

    res.status = (code) => {
        res.statusCode = code;
        return res;
    };

    res.setHeader = (key, value) => {
        res.headers[key] = value;
        return res;
    };

    res.json = (data) => {
        res.body = data;
        res.ended = true;
        return res;
    };

    res.send = (data) => {
        res.body = data;
        res.ended = true;
        return res;
    };

    res.end = () => {
        res.ended = true;
        return res;
    };

    return res;
}
