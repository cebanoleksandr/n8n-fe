import{r as e}from"./rolldown-runtime-hePW80VL.js";import{B as t,D as n,E as r,I as i,M as a,N as o,P as s,U as c,V as l,X as u,Z as d,b as f,g as p,h as m,m as h}from"./createSvgIcon-CGp2e8-z.js";var g=e(d(),1);function _(e){return Object.keys(e).length===0}function v(e=null){let t=g.useContext(c);return!t||_(t)?e:t}var y=i();function b(e=y){return v(e)}var x=typeof window<`u`?g.useLayoutEffect:g.useEffect;function S(){let e=b(f);return e.$$material||e}function C(...e){let t=g.useRef(void 0),n=g.useCallback(t=>{let n=e.map(e=>{if(e==null)return null;if(typeof e==`function`){let n=e,r=n(t);return typeof r==`function`?r:()=>{n(null)}}return e.current=t,()=>{e.current=null}});return()=>{n.forEach(e=>e?.())}},e);return g.useMemo(()=>e.every(e=>e==null)?null:e=>{t.current&&=(t.current(),void 0),e!=null&&(t.current=n(e))},e)}function w(e){let t=g.useRef(e);return x(()=>{t.current=e}),g.useRef((...e)=>(0,t.current)(...e)).current}var T=C,E=w,D={};function O(e,t){let n=g.useRef(D);return n.current===D&&(n.current=e(t)),n}var k=u(),A=`(prefers-reduced-motion: reduce)`,ee=0,te=`0ms`,ne=()=>{},j=()=>!1,re=()=>!0,ie=()=>ne;function M(e){let[t,n]=g.useState(()=>({enabled:e,matches:e?null:!1})),r=t.matches;return t.enabled!==e&&(r=null,e||(r=!1)),x(()=>{let r=t=>{n(n=>n.enabled===e&&n.matches===t?n:{enabled:e,matches:t})};if(!e){t.enabled&&r(!1);return}if(typeof window>`u`||typeof window.matchMedia!=`function`){r(!1);return}let i=window.matchMedia(A),a=()=>{r(i.matches)};return a(),i.addEventListener(`change`,a),()=>{i.removeEventListener(`change`,a)}},[e,t.enabled]),r}var N={...g}.useSyncExternalStore;function P(e){let t=e?re:j,[n,r]=g.useMemo(()=>{if(!e||typeof window>`u`||typeof window.matchMedia!=`function`)return[j,ie];let t=window.matchMedia(A);return[()=>t.matches,e=>(t.addEventListener(`change`,e),()=>{t.removeEventListener(`change`,e)})]},[e]);return N(r,n,t)}var F=N===void 0?M:P;function I(e,t){let n=F(!t&&e===`system`),r=!t&&(e===`always`||e===`system`&&n!==!1);return g.useMemo(()=>({shouldReduceMotion:r,getTransitionTiming(e){return r?{duration:ee,delay:te}:e}}),[r])}function L(e){try{return e.matches(`:focus-visible`)}catch{}return!1}function R(e){let{focusableWhenDisabled:t,disabled:n,composite:r=!1,tabIndex:i=0,isNativeButton:a}=e,o=r&&t!==!1,s=r&&t===!1;return g.useMemo(()=>{let e={onKeyDown(e){n&&t&&e.key!==`Tab`&&e.preventDefault()}};return r||(e.tabIndex=i,!a&&n&&(e.tabIndex=t?i:-1)),(a&&(t||o)||!a&&n)&&(e[`aria-disabled`]=n),a&&(!t||s)&&(e.disabled=n),e},[r,n,t,o,s,a,i])}var z={};function ae(e){let{nativeButton:t,nativeButtonProp:n,internalNativeButton:r=t,allowInferredHostMismatch:i=!1,disabled:a,type:o,hasFormAction:s=!1,tabIndex:c=0,focusableWhenDisabled:l,stopEventPropagation:u=!1,onBeforeKeyDown:d,onBeforeKeyUp:f}=e,p=g.useRef(null),m=l===!0,h=R({focusableWhenDisabled:m,disabled:a,isNativeButton:t,tabIndex:c}),_=g.useCallback(()=>{let e=p.current;return e==null?t:e.tagName===`BUTTON`||!!(e.tagName===`A`&&e.href)},[t]),v=g.useMemo(()=>{let e=m?{}:{tabIndex:a?-1:c};return t?(e.type=o===void 0&&!s?`button`:o,m||(e.disabled=a)):(e.role=`button`,!m&&a&&(e[`aria-disabled`]=a)),m?{...e,...h}:e},[a,m,h,s,t,c,o]);return{getButtonProps:g.useCallback((e=z)=>{let{onClick:t,onKeyDown:n,onKeyUp:r,...i}=e,o=e=>{if(u&&e.stopPropagation(),a){e.preventDefault();return}t?.(e)},s=e=>{if(m&&h.onKeyDown(e),!a&&(d?.(e),n?.(e),!(e.target!==e.currentTarget||_()))){if(e.key===` `){e.preventDefault();return}e.key===`Enter`&&(e.preventDefault(),e.currentTarget.click())}},c=e=>{a||(f?.(e),r?.(e),e.target===e.currentTarget&&!_()&&e.key===` `&&!e.defaultPrevented&&e.currentTarget.click())};return{...v,...i,onClick:o,onKeyDown:s,onKeyUp:c}},[v,a,m,h,_,d,f,u]),rootRef:p}}var B=class e{static create(){return new e}static use(){let t=O(e.create).current,[n,r]=g.useState(!1);return t.shouldMount=n,t.setShouldMount=r,g.useEffect(t.mountEffect,[n]),t}constructor(){this.ref={current:null},this.mounted=null,this.didMount=!1,this.shouldMount=!1,this.setShouldMount=null}mount(){return this.mounted||(this.mounted=se(),this.shouldMount=!0,this.setShouldMount(this.shouldMount)),this.mounted}mountEffect=()=>{this.shouldMount&&!this.didMount&&this.ref.current!==null&&(this.didMount=!0,this.mounted.resolve())};start(...e){this.mount().then(()=>this.ref.current?.start(...e))}stop(...e){this.mount().then(()=>this.ref.current?.stop(...e))}pulsate(...e){this.mount().then(()=>this.ref.current?.pulsate(...e))}};function oe(){return B.use()}function se(){let e,t,n=new Promise((n,r)=>{e=n,t=r});return n.resolve=e,n.reject=t,n}var V=[];function H(e){g.useEffect(e,V)}var U=class e{static create(){return new e}currentId=null;start(e,t){this.clear(),this.currentId=setTimeout(()=>{this.currentId=null,t()},e)}clear=()=>{this.currentId!==null&&(clearTimeout(this.currentId),this.currentId=null)};disposeEffect=()=>this.clear};function W(){let e=O(U.create).current;return H(e.disposeEffect),e}function G(e){let{className:t,classes:n,pulsate:r=!1,rippleX:i,rippleY:a,rippleSize:o,in:c,onExited:l,timeout:u}=e,[d,f]=g.useState(!1),p=W(),m=g.useRef(!1),h=g.useRef(l);h.current=l;let _=l!=null,v=s(t,n.ripple,n.rippleVisible,r&&n.ripplePulsate),y={width:o,height:o,top:-(o/2)+a,left:-(o/2)+i},b=s(n.child,d&&n.childLeaving,r&&n.childPulsate);return!c&&!d&&f(!0),g.useEffect(()=>{!c&&_?m.current||(m.current=!0,p.start(u,()=>{m.current=!1,h.current?.()})):(m.current=!1,p.clear())},[p,_,c,u]),(0,k.jsx)(`span`,{className:v,style:y,children:(0,k.jsx)(`span`,{className:b})})}var K=a(`MuiTouchRipple`,[`root`,`ripple`,`rippleVisible`,`ripplePulsate`,`child`,`childLeaving`,`childPulsate`]),q=550,J={},Y=[],ce=()=>{};function X(e,t){let n=new Set(t),r=new Map,i=[];for(let t of e)n.has(t)?i.length>0&&(r.set(t,i),i=[]):i.push(t);let a=[];for(let e of t){let t=r.get(e);t&&a.push(...t),a.push(e)}return a.push(...i),a}function le({event:e,element:t,center:n}){let r=t?t.getBoundingClientRect():{width:0,height:0,left:0,top:0},i,a;if(n||e===void 0||e.clientX===0&&e.clientY===0||!e.clientX&&!e.touches)i=Math.round(r.width/2),a=Math.round(r.height/2);else{let{clientX:t,clientY:n}=e.touches&&e.touches.length>0?e.touches[0]:e;i=Math.round(t-r.left),a=Math.round(n-r.top)}let o;if(n)o=Math.sqrt((2*r.width**2+r.height**2)/3),o%2==0&&(o+=1);else{let e=Math.max(Math.abs((t?t.clientWidth:0)-i),i)*2+2,n=Math.max(Math.abs((t?t.clientHeight:0)-a),a)*2+2;o=Math.sqrt(e**2+n**2)}return{rippleX:i,rippleY:a,rippleSize:o}}var ue=l`
  0% {
    transform: scale(0);
    opacity: 0.1;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`,de=l`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`,fe=l`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.92);
  }

  100% {
    transform: scale(1);
  }
`;function pe(e){if(e.motion.reducedMotion===`always`)return null;let n=t`
    &.${K.rippleVisible} {
      animation-name: ${ue};
      animation-duration: ${q}ms;
      animation-timing-function: ${e.transitions.easing.easeInOut};
    }

    &.${K.ripplePulsate} {
      animation-duration: ${e.transitions.duration.shorter}ms;
    }

    & .${K.childLeaving} {
      animation-name: ${de};
      animation-duration: ${q}ms;
      animation-timing-function: ${e.transitions.easing.easeInOut};
    }

    & .${K.childPulsate} {
      animation-name: ${fe};
      animation-duration: 2500ms;
      animation-timing-function: ${e.transitions.easing.easeInOut};
      animation-iteration-count: infinite;
      animation-delay: 200ms;
    }
  `;return e.motion.reducedMotion===`system`?t`
      @media (prefers-reduced-motion: no-preference) {
        ${n}
      }
    `:n}var me=p(`span`,{name:`MuiTouchRipple`,slot:`Root`})({overflow:`hidden`,pointerEvents:`none`,position:`absolute`,zIndex:0,top:0,right:0,bottom:0,left:0,borderRadius:`inherit`}),he=p(G,{name:`MuiTouchRipple`,slot:`Ripple`})`
  opacity: 0;
  position: absolute;

  &.${K.rippleVisible} {
    opacity: 0.3;
    transform: scale(1);
  }

  /*
   * Order matters: 'child', 'childLeaving' and 'childPulsate' apply to the same
   * element with equal specificity, so the later rule wins. 'child' must come
   * before 'childLeaving' so the leaving 'opacity: 0' takes precedence. A focus
   * (pulsate) ripple keeps 'pulsateKeyframe' (no opacity animation) on exit, so
   * it relies on this static 'opacity: 0' to disappear on blur instead of
   * lingering until removal.
   */
  & .${K.child} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }

  & .${K.childLeaving} {
    opacity: 0;
  }

  & .${K.childPulsate} {
    position: absolute;
    /* @noflip */
    left: 0px;
    top: 0;
  }

  ${({theme:e})=>pe(e)}
`,ge=g.forwardRef(function(e,t){let n=m({props:e,name:`MuiTouchRipple`}),r=I(S().motion.reducedMotion,!1),{center:i=!1,classes:a=J,className:o,...c}=n,[l,u]=g.useState({items:Y,order:Y}),d=l.items,f=g.useRef(0),p=g.useRef(null),h=g.useRef(!1);H(()=>(h.current=!0,()=>{h.current=!1})),g.useEffect(()=>{p.current&&=(p.current(),null)},[d]);let _=g.useRef(!1),v=W(),y=g.useRef(null),b=g.useRef(null),x=E(e=>{h.current&&u(t=>{let n=t.items.filter(t=>t.key!==e);return{items:n,order:X(t.order.filter(t=>t!==e),n.filter(e=>!e.exiting).map(e=>e.key))}})}),C=E(e=>{let{pulsate:t,rippleX:n,rippleY:r,rippleSize:i,cb:a}=e,o=f.current;f.current+=1,u(e=>{let a=[...e.items,{key:o,pulsate:t,rippleX:n,rippleY:r,rippleSize:i,exiting:!1}];return{items:a,order:X(e.order,a.filter(e=>!e.exiting).map(e=>e.key))}}),p.current=a}),w=E((e=J,t=J,n=ce)=>{let{pulsate:r=!1,center:a=i||t.pulsate,fakeElement:o=!1}=t;if(e?.type===`mousedown`&&_.current){_.current=!1;return}e?.type===`touchstart`&&(_.current=!0);let{rippleX:s,rippleY:c,rippleSize:l}=le({event:e,element:o?null:b.current,center:a});e?.touches?y.current===null&&(y.current=()=>{C({pulsate:r,rippleX:s,rippleY:c,rippleSize:l,cb:n})},v.start(80,()=>{y.current&&=(y.current(),null)})):C({pulsate:r,rippleX:s,rippleY:c,rippleSize:l,cb:n})}),T=E(()=>{w(J,{pulsate:!0})}),D=E((e,t)=>{if(v.clear(),e?.type===`touchend`&&y.current){y.current(),y.current=null,v.start(0,()=>{D(e,t)});return}y.current=null,u(e=>{let t=e.items.findIndex(e=>!e.exiting);if(t===-1)return e;let n=e.items.slice();return n[t]={...n[t],exiting:!0},{items:n,order:X(e.order,n.filter(e=>!e.exiting).map(e=>e.key))}}),p.current=t});g.useImperativeHandle(t,()=>({pulsate:T,start:w,stop:D}),[T,w,D]);let O=new Map(d.map(e=>[e.key,e])),A=l.order.map(e=>O.get(e)).filter(Boolean);return(0,k.jsx)(me,{className:s(K.root,a.root,o),ref:b,...c,children:A.map(e=>(0,k.jsx)(he,{classes:{ripple:s(a.ripple,K.ripple),rippleVisible:s(a.rippleVisible,K.rippleVisible),ripplePulsate:s(a.ripplePulsate,K.ripplePulsate),child:s(a.child,K.child),childLeaving:s(a.childLeaving,K.childLeaving),childPulsate:s(a.childPulsate,K.childPulsate)},timeout:r.shouldReduceMotion?0:q,pulsate:e.pulsate,rippleX:e.rippleX,rippleY:e.rippleY,rippleSize:e.rippleSize,in:!e.exiting,onExited:()=>x(e.key)},e.key))})});function _e(e){return o(`MuiButtonBase`,e)}var Z=a(`MuiButtonBase`,[`root`,`disabled`,`focusVisible`]),ve=e=>{let{disabled:t,focusVisible:r,focusVisibleClassName:i,suppressFocusVisible:a,classes:o}=e,s=n({root:[`root`,t&&`disabled`,r&&!a&&`focusVisible`]},_e,o);return r&&!a&&i&&(s.root+=` ${i}`),s},ye=p(`button`,{name:`MuiButtonBase`,slot:`Root`})(h(({theme:e})=>({display:`inline-flex`,alignItems:`center`,justifyContent:`center`,position:`relative`,boxSizing:`border-box`,WebkitTapHighlightColor:`transparent`,backgroundColor:`transparent`,outline:0,border:0,margin:0,borderRadius:0,padding:0,cursor:`pointer`,userSelect:`none`,verticalAlign:`middle`,MozAppearance:`none`,WebkitAppearance:`none`,textDecoration:`none`,color:`inherit`,"&::-moz-focus-inner":{borderStyle:`none`},[`&.${Z.disabled}`]:{pointerEvents:`none`,cursor:`default`},"@media print":{colorAdjust:`exact`},variants:[{props:{internalDisabledThemeFocusVisible:!1},style:e.focusVisible&&{...r,[`&.${Z.focusVisible}`]:e.focusVisible}}]}))),be=g.forwardRef(function(e,t){let n=m({props:e,name:`MuiButtonBase`}),{action:r,centerRipple:i=!1,children:a,className:o,component:c=`button`,disabled:l=!1,disableRipple:u=!1,disableTouchRipple:d=!1,focusRipple:f=!1,focusVisibleClassName:p,focusableWhenDisabled:h,suppressFocusVisible:_=!1,internalNativeButton:v,internalDisabledThemeFocusVisible:y=!1,LinkComponent:b=`a`,nativeButton:x,onBlur:S,onClick:C,onContextMenu:w,onDragLeave:D,onFocus:O,onFocusVisible:A,onKeyDown:ee,onKeyUp:te,onMouseDown:ne,onMouseLeave:j,onMouseUp:re,onTouchEnd:ie,onTouchMove:M,onTouchStart:N,tabIndex:P=0,TouchRippleProps:F,touchRippleRef:I,type:R,...z}=n,B=!!(z.href||z.to),se=!!z.formAction,V=c;V===`button`&&B&&(V=b);let H=typeof V==`string`?V===`button`:v??!1,U=x??H,W=oe(),G=T(W.ref,I),[K,q]=g.useState(!1);(l||_)&&K&&q(!1);let J=E(e=>{f&&!e.repeat&&K&&e.key===` `&&W.stop(e,()=>{W.start(e)})}),Y=E(e=>{f&&e.key===` `&&K&&!e.defaultPrevented&&W.stop(e,()=>{W.pulsate(e)})}),{getButtonProps:ce,rootRef:X}=ae({nativeButton:U,nativeButtonProp:x,internalNativeButton:H,allowInferredHostMismatch:B||typeof V==`string`,disabled:l,type:R,hasFormAction:se,tabIndex:P,onBeforeKeyDown:J,onBeforeKeyUp:Y}),{onClick:le,onKeyDown:ue,onKeyUp:de,...fe}=ce({onClick:C,onKeyDown:ee,onKeyUp:te});g.useImperativeHandle(r,()=>({focusVisible:()=>{q(!0),X.current.focus()}}),[X]);let pe=W.shouldMount&&!u&&!l;g.useEffect(()=>{K&&f&&!u&&W.pulsate()},[u,f,K,W]);let me=Q(W,`start`,ne,d),he=Q(W,`stop`,w,d),_e=Q(W,`stop`,D,d),Z=Q(W,`stop`,re,d),be=Q(W,`stop`,e=>{K&&e.preventDefault(),j&&j(e)},d),xe=Q(W,`start`,N,d),Se=Q(W,`stop`,ie,d),Ce=Q(W,`stop`,M,d),we=Q(W,`stop`,e=>{L(e.target)||q(!1),S&&S(e)},!1),Te=E(e=>{X.current||=e.currentTarget,!_&&L(e.target)&&(q(!0),A&&A(e)),O&&O(e)}),$={};B&&($.tabIndex=l?-1:P,l&&($[`aria-disabled`]=l),$.type=R);let Ee=T(t,X),De={...n,centerRipple:i,component:c,disabled:l,disableRipple:u,disableTouchRipple:d,focusRipple:f,suppressFocusVisible:_,tabIndex:P,focusVisible:K,internalDisabledThemeFocusVisible:y},Oe=ve(De);return(0,k.jsxs)(ye,{as:V,className:s(Oe.root,o),ownerState:De,onBlur:we,onClick:le,onContextMenu:he,onFocus:Te,onKeyDown:ue,onKeyUp:de,onMouseDown:me,onMouseLeave:be,onMouseUp:Z,onDragLeave:_e,onTouchEnd:Se,onTouchMove:Ce,onTouchStart:xe,ref:Ee,...B?$:fe,...z,children:[a,pe?(0,k.jsx)(ge,{ref:G,center:i,...F}):null]})});function Q(e,t,n,r=!1){return E(i=>(n&&n(i),r||e[t](i),!0))}export{L as a,E as c,C as d,S as f,v as h,W as i,T as l,b as m,Z as n,I as o,x as p,U as r,O as s,be as t,w as u};