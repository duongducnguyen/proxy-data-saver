!macro customInstall
  ; Kill running instance before installing new version
  nsExec::ExecToLog 'taskkill /F /IM "Proxy Data Saver.exe" /T'
  Sleep 1500
!macroend
