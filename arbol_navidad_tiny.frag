#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform float u_time;
void main(){
vec2 p=(gl_FragCoord.xy*2.-u_resolution)/u_resolution.y;
float y=p.y+.35,Y=y*3.,w=(3.-floor(Y))*.11*(1.-fract(Y)*.6);
float T=step(abs(p.x),.03)*step(abs(y-.05),.05);
float A=step(abs(y-.55),.45)*step(abs(p.x),w);
float L=smoothstep(.02,0.,abs(sin(y*22.+p.x*9.)))*A+(.01+.004*sin(u_time*4.))/length(p-vec2(0,.67));
vec3 c=vec3(.3,.15,.05)*T+vec3(0,.35,0)*A+vec3(1,.85,.2)*L*1.6;
gl_FragColor=vec4(c,1);
}