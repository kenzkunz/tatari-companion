import {supabase,accountUrl} from '../auth-client.mjs';
const status=document.getElementById('callback-status');
try{const url=new URL(location.href);if(url.searchParams.has('error'))throw Error(url.searchParams.get('error_description')||'Login was cancelled.');const {data:{session},error}=await supabase.auth.getSession();if(error)throw error;if(!session)throw Error('Login could not finish. Please start again from the same browser.');history.replaceState(null,'',location.pathname);location.replace(accountUrl);}catch(error){status.textContent=error.message;}
