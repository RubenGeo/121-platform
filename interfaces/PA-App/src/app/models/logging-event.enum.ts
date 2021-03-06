export enum LoggingEventCategory {
  progress = 'progress',
  input = 'input',
  ui = 'UI',
  error = 'error',
}

export enum LoggingEvent {
  accountCreated = 'account-created',
  acccountDeleteFail = 'account-delete-fail',
  acccountDeleteSucces = 'account-delete-succes',
  audioPause = 'audio-pause',
  audioPlay = 'audio-play',
  error = 'error',
  exception = 'exception',
  languageChosen = 'language-chosen',
  loginFail = 'login-fail',
  loginSucces = 'login-succes',
  logout = 'log-out',
  passwordInputToggle = 'password-input-toggle',
  passwordNotEqual = 'password-not-equal',
  passwordNotValid = 'password-not-valid',
  popUpOpen = 'pop-up-open',
  qaAnswerNotValid = 'qa-answer-not-valid',
  qaQuestionShown = 'qa-question-shown',
  sectionCompleted = 'section-completed',
  usernameNotUnique = 'username-not-unique',
}
