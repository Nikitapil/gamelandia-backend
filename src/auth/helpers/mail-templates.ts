export const getRestorePasswordTemplate = (key: string, clientURL: string) => {
  return `<div style="background: linear-gradient(179.4deg,#0c1445 -16.9%,#471e54 119.9%); color: #fff; padding: 10px; min-height: 300px;">
            <div style="max-width: fit-content; margin: 40px auto;">
                <h1 style="margin-bottom: 10px; text-align: center; color: #fff">Hello!!!</h1>
                <p style="margin: 0; font-size: 20px; color: #fff">There your unique secrect key for create new password:</p>
                <p style="margin-top: 15px; font-size: 24px; font-weight:700; background: rgba(255,255,255, 0.1); padding: 5px 10px; text-align:center">${key}</p>
                <a href="${clientURL}/gamelandia" style="color:#fff; display:block; margin-left: auto; width: fit-content;">Gamelandia</a>
            </div>
          </div>`;
};
