for (($i = 0); $i -lt 10; $i++)
{
  New-Item -Name "trigger_workflows" -Value ((Get-Content trigger_workflows) / 1 + 1) -Force;
  git add .;
  git commit -m "trigger_workflows";
  git push origin (git rev-parse --abbrev-ref HEAD);
  Start-Sleep -Seconds 120;
}