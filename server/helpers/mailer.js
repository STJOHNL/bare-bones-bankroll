import sgMail from '@sendgrid/mail'

// Example data
// data = {
//   recipient: 'email@email.com',
//   name: 'JoeSmoe',
// }

const FROM_NAME = 'Bare Bones Bankroll'

// Every sender throws on failure — callers decide whether to catch and log.
// Nothing is sent while running the test suite.
const send = async msg => {
  if (process.env.NODE_ENV === 'test') return null
  return await sgMail.send(msg)
}

const from = () => ({
  email: process.env.FROM_EMAIL,
  name: FROM_NAME,
})

export default {
  // Password Reset
  // d-c8686b423f3c4d989406a3410f76d9ce
  sendPasswordReset: async data => {
    return await send({
      to: data.recipient,
      from: from(),
      templateId: 'd-c8686b423f3c4d989406a3410f76d9ce',
      dynamicTemplateData: {
        name: data.name,
        link: data.link,
      },
    })
  },

  // Support Message Sent (confirmation to the user)
  // d-bf07c796f45a41019d4800b1f070e831
  sendMessageSent: async data => {
    return await send({
      to: data.recipient,
      from: from(),
      templateId: 'd-bf07c796f45a41019d4800b1f070e831',
      dynamicTemplateData: {
        name: data.name,
        message: data.message,
      },
    })
  },

  // Send Message Received (notification to the admin)
  // d-2d8306a52fc347389e63b38528abedc8
  sendMessageReceived: async data => {
    return await send({
      to: data.recipient,
      from: from(),
      replyTo: data.reply,
      templateId: 'd-2d8306a52fc347389e63b38528abedc8',
      dynamicTemplateData: {
        name: data.name,
        category: data.category,
        message: data.message,
      },
    })
  },
}
