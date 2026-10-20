import{r as e}from"./rolldown-runtime-hePW80VL.js";import{F as t,H as n,N as r,O as i,P as a,Q as o,V as s,Z as c,_ as l,g as u,h as d,m as f,n as p,s as m,u as h}from"./createSvgIcon-DnD72tHP.js";var g=e(o(),1);function _(e){return a(`MuiCircularProgress`,e)}r(`MuiCircularProgress`,[`root`,`determinate`,`indeterminate`,`colorPrimary`,`colorSecondary`,`svg`,`track`,`circle`,`circleDisableShrink`]);var v=c(),y=44,b=n`
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
`,x=n`
  0% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -15px;
  }

  100% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: -126px;
  }
`,S=typeof b==`string`?null:s`
        animation: ${b} 1.4s linear infinite;
      `,C=typeof x==`string`?null:s`
        animation: ${x} 1.4s ease-in-out infinite;
      `,w=e=>{let{classes:t,variant:n,color:r,disableShrink:a}=e,o={root:[`root`,n,`color${f(r)}`],svg:[`svg`],track:[`track`],circle:[`circle`,a&&`circleDisableShrink`]};return i(o,_,t)},T=l(`span`,{name:`MuiCircularProgress`,slot:`Root`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.root,t[n.variant],t[`color${f(n.color)}`]]}})(d(({theme:e})=>{let t=m(e,{animation:`none`});return{display:`inline-block`,variants:[{props:{variant:`determinate`},style:{...h(e,`transform`)}},{props:{variant:`indeterminate`},style:S||{animation:`${b} 1.4s linear infinite`}},...t?[{props:{variant:`indeterminate`},style:t}]:[],...Object.entries(e.palette).filter(p()).map(([t])=>({props:{color:t},style:{color:(e.vars||e).palette[t].main}}))]}})),E=l(`svg`,{name:`MuiCircularProgress`,slot:`Svg`})({display:`block`}),D=l(`circle`,{name:`MuiCircularProgress`,slot:`Circle`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.circle,n.disableShrink&&t.circleDisableShrink]}})(d(({theme:e})=>{let t=m(e,{animation:`none`});return{stroke:`currentColor`,variants:[{props:{variant:`determinate`},style:{...h(e,`stroke-dashoffset`)}},{props:{variant:`indeterminate`},style:{strokeDasharray:`80px, 200px`,strokeDashoffset:0}},{props:({ownerState:e})=>e.variant===`indeterminate`&&!e.disableShrink,style:C||{animation:`${x} 1.4s ease-in-out infinite`}},...t?[{props:({ownerState:e})=>e.variant===`indeterminate`&&!e.disableShrink,style:t}]:[]]}})),O=l(`circle`,{name:`MuiCircularProgress`,slot:`Track`})(d(({theme:e})=>({stroke:`currentColor`,opacity:(e.vars||e).palette.action.activatedOpacity}))),k=g.forwardRef(function(e,n){let r=u({props:e,name:`MuiCircularProgress`}),{className:i,color:a=`primary`,disableShrink:o=!1,enableTrackSlot:s=!1,min:c,max:l,size:d=40,style:f,thickness:p=3.6,value:m=r.min??0,variant:h=`indeterminate`,...g}=r,_=c??0,b=l??100,x={...r,color:a,disableShrink:o,size:d,thickness:p,value:m,variant:h,enableTrackSlot:s},S=w(x),C={},k={},A={};if(h===`determinate`){let e=2*Math.PI*((y-p)/2),t=b-_;C.strokeDasharray=e.toFixed(3),C.strokeDashoffset=t>0?`${((b-m)/t*e).toFixed(3)}px`:`${e.toFixed(3)}px`,k.transform=`rotate(-90deg)`,A[`aria-valuenow`]=m,A[`aria-valuemin`]=_,A[`aria-valuemax`]=b}return(0,v.jsx)(T,{className:t(S.root,i),style:{width:d,height:d,...k,...f},ownerState:x,ref:n,role:`progressbar`,...A,...g,children:(0,v.jsxs)(E,{className:S.svg,ownerState:x,viewBox:`${y/2} ${y/2} ${y} ${y}`,children:[s?(0,v.jsx)(O,{className:S.track,ownerState:x,cx:y,cy:y,r:(y-p)/2,fill:`none`,strokeWidth:p,"aria-hidden":`true`}):null,(0,v.jsx)(D,{className:S.circle,style:C,ownerState:x,cx:y,cy:y,r:(y-p)/2,fill:`none`,strokeWidth:p})]})})});export{k as t};