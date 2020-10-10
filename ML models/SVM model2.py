

import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
dataset=pd.read_csv('Data1.csv')
X=dataset.iloc[:, 0:4].values
Y=dataset.iloc[:, -1].values
z=dataset.iloc[:, 0].values
np.set_printoptions(threshold=np.nan)

from sklearn.cross_validation import train_test_split
X_train,X_test,Y_train,Y_test = train_test_split(X,Y,test_size=0.2,random_state = 0)


#from future scalling
from sklearn.preprocessing import StandardScaler
sc_X = StandardScaler()
sc_Y = StandardScaler()

X = sc_X.fit_transform(X)
X = sc_Y.fit_transform(Y)

#fiting the regression model to the data set
#fitting svr to the data set
from sklearn.svm import SVR
regressor = SVR(kernel = 'rbf')
regressor.fit(X,Y)

regressor.fit(X_train, Y_train)


#future prediction
Y_predfuture = regressor.predict([[9700,1017,469,0]])
print(Y_predfuture)



'''plt.scatter(z,Y, color = 'red')
plt.plot(X, regressor.predict(X),color = 'green')
plt.title('day vs sold')
plt.xlabel('day')
plt.ylabel('sold items')
plt.show()'''


#for higheminr resolution
"""X_grid = np.arrange(min(X),max(X),0.1)
X_grid = X_grid.reshape(len(X_grid),1)
plt.scatter(X,Y, color = 'red')
plt.plot(X, regressor.predict(X_grid),color = 'green')
plt.title('truth or bluf SVRf')
plt.xlabel('position level')
plt.ylabel('salary')
plt.show()"""



