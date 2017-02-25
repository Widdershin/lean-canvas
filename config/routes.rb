Rails.application.routes.draw do
  devise_for :models
  root to: 'canvases#new'

  resource :canvases
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
end
