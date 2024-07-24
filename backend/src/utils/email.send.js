import nodemailer from 'nodemailer';



const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: "isroo0522@gmail.com",
        pass:  "yencabczivrhokcb"
      }
})


const sendEmail = async(to, subject,html)=>{
    const mailOptions ={
        from: "isroo0522@gmail.com",
        to,
        subject,
        html
    }

    try {
        const info = transporter.sendMail(mailOptions)
        return info;
    } catch (error) {
        throw error
    }
}
export default sendEmail;




