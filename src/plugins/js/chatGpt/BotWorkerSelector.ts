const {$} = window

export default class BotWorkerSelector {
  get loginButton() {
    return $('button').filter(function() {
      //@ts-ignore
      return $(this).text().trim() === 'Log in'; });
  }

  get regenerateResponseButton() {
    return $('button').filter(function() {
      //@ts-ignore
      return $(this).text().trim() === 'Regenerate response'; });
  }

  get promptTextArea() {
    return $("#prompt-textarea");
  }

  get promptSendButton() {
    return this.promptTextArea.next("button");
  }

  get challengeForm() {
    return $("#challenge-form");
  }

  get loginPage() {
    return $(".login-id");
  }

  get loginPasswordPage() {
    return $("._form-login-password");
  }

  get usernameInput() {
    return $("#username");
  }

  get passwordInput() {
    return $("#password");
  }

  get passwordInputPageContinueButton() {
    return $("._button-login-password");
  }

  get usernameInputPageContinueButton() {
    return $("._button-login-id");
  }

  get startPopUpModal() {
    return $(".absolute.inset-0");
  }

  get startPopUpModalButton(){
    if (this.startPopUpModal.length > 0) {
      const buttons = $(".absolute.inset-0").find("button");
      if (buttons.length > 0) {
        return $(buttons[buttons.length - 1]);
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
}
