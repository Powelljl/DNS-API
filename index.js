
import { response } from 'cfw-easy-utils'

const Router = require('./router')

async function cloudflareDNS(request) {	
	try {
		let url 				= new URL(request.url)
		let domain 				= url.pathname.split('/')[4]
		let type 				= url.pathname.split('/')[5]

		let dnssec_data;
		let dnssec_validation;

		if (url.pathname.split('/')[6] !== null) {
			dnssec_data = url.pathname.split('/')[6];
		} else {
			dnssec_data = 0;
		}
		
		if (url.pathname.split('/')[7] !== null) {
			dnssec_validation = url.pathname.split('/')[7];
		} else {
			dnssec_validation = 0;
		}
		
		let filter = url.pathname.split('/')[8]		
		
		let init = {}
		let body = {}
		let data = {}
		let results = {}
		
		let dns_url_prefix = 'https://';
		let dns_url = 'cloudflare-dns.com/dns-query';
		
		if (type) {
			let query = {}
			
			if (filter === 'normal') {
				query = new URL(dns_url_prefix + dns_url);
			} else if (filter === 'security') {
				query = new URL(dns_url_prefix + 'security.' + dns_url);
			} else if(filter === 'family') {
				query = new URL(dns_url_prefix + 'family.' + dns_url);
			} else {
				query = new URL(dns_url_prefix + dns_url);
			}
		
			query.searchParams.set('name', domain);
			query.searchParams.set('type', type.toLowerCase());
			query.searchParams.set('do', dnssec_data);
			query.searchParams.set('cd', dnssec_validation);
			
			init = {
				headers: { 'Accept': 'application/dns-json' }
			}
						
			data = await fetch(query.href, init)
			return response.json(await data.json())
		} else {
			body = domain
			return new Response('Please specify a type', init)			
		}
	} catch (error) {
		return new Response(JSON.stringify({ message: error.message, stack: error.stack }), { headers: { "Content-Type": "application/json" }})
	}	
}

async function googleDNS(request) {	
	try {
		let url		= new URL(request.url)
		let domain	= url.pathname.split('/')[4]
		let type	= url.pathname.split('/')[5]
		
		let dnssec_data;
		let dnssec_validation;

		if (url.pathname.split('/')[6] != null) {
			dnssec_data = url.pathname.split('/')[6];
		} else {
			dnssec_data = 0;
		}
		
		if (url.pathname.split('/')[7] != null) {
			dnssec_validation = url.pathname.split('/')[7];
		} else {
			dnssec_validation = 0;
		}
		
		let init 	= {}
		let body 	= {}
		let data 	= {}
		
		if (type) {
			let query = new URL("https://dns.google/resolve");
			query.searchParams.set('name', domain);
			query.searchParams.set('type', type.toLowerCase());
			query.searchParams.set('do', dnssec_data);
			query.searchParams.set('cd', dnssec_validation);
			
			data = await fetch(query.href, init)
			return response.json(await data.json())
		} else {
			body = domain
			return new Response("Please specify a type", init)			
		}
	} catch (error) {
		return new Response(JSON.stringify({ message: error.message, stack: error.stack }), { headers: { "Content-Type": "application/json" }})
	}	
}

async function handleRequest(request) {
    const r = new Router()
    
	r.get('/', 							() => new Response('Specify a provider'))
    r.get('/api/dns/cloudflare.*', 		request => cloudflareDNS(request))
    r.get('/api/dns/google.*', 			request => googleDNS(request))

    const resp = await r.route(request)
    return resp
}

addEventListener('fetch', (event) => {
    if (event.request.method == 'OPTIONS') {
        return event.respondWith(response.cors())
    }

    return event.respondWith(handleRequest(event.request));
})
