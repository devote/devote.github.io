/**
 * Component является общим предком всех классов компонентов.
 *
 * @author <a href="mailto:spb.piksel@gmail.com">Dmitrii Pakhtinov</a>
 * @requires refine
 * @version 2.0
 * @date 12/20/2012
 *
 * @namespace SP
 */
refine("SP.Component", function() {

  /**
   * Ссылка на родительский компонент
   *
   * @type {SP.Component|null}
   * @private
   */
  var owner = null;

  /**
   * Список дочерних компонентов
   *
   * @type {SP.Component[]}
   * @private
   */
  var components = [];

  /**
   * @lends SP.Component#
   */
  return {

    /**
     * Общий предок всех компонентов, каждый компонент обязан наследоватся от этого класса
     *
     * @constructs
     */
    Component: function() {
      // dummy
    },

    /**
     * Устанавливает или возвращает родительский компонент
     * Для удаления родительского компонента установите значение <b>null</b>
     *
     * Родительский компонент является владельцем компонента и может оперировать
     * свойствами дочернего компонента. Присвоеный компонент является владельцем
     * компонента которому его присвоили и в случае удаления владельца, будут
     * удалены все его подчиненные компоненты, если вы не хотите потерять подчиненные
     * копоненты, позаботьтесь об этом заранее
     *
     * @type {SP.Component|null}
     * @property
     * @public
     * @final
     */
    owner: {

      /**
       * @param {SP.Component|null} component
       */
      set: function(component) {

        // пропускаем только если текущая ссылка на владельца иная и это наследник компонента
        if (component !== owner && (component === null || SP.Component.getInstanceOf(component))) {

          // удаляем у текущего владельца данный компонент
          if (owner) {
            // если владелец не позволит удалить компонет
            if (owner.onRemoveComponent(this) === false) {
              return;
            }
            owner.removeComponent.call(false, this, owner);
          }

          // добавляем владельцу текущий компонент
          if (component) {
            // если компонент не позволит его добавить
            if (component.onInsertComponent(this) === false) {
              return;
            }
            component.insertComponent.call(false, this, component);
          }

          // меняем ссылку на владельца
          owner = component;
        }
      },

      get: function() {
        return owner;
      }
    },

    /**
     * Добавляет в список дочерний компонент
     *
     * @param {SP.Component} component компонент который будет дочерним
     * @return {Boolean} возвращает <b>true</b> при успешном выполнении, в противном случае <b>false</b>
     * @public
     * @final
     * @see {@link get.components}
     */
    insertComponent: function(component) {

      // Условие для внутреннего использования
      if (this instanceof Boolean && arguments.length > 1) {

        // Добавляем компонент в список
        components[components.length] = component;

        // информируем компонент о том что его добавли владельцу
        component.onInsert(arguments[1]);

      } else if (SP.Component.getInstanceOf(component)) {
        // Если объект является компонентом пробуем добавить его
        return components.length < (component.owner = this, components.length);
      }

      return false;
    },

    /**
     * Удаляет из списка дочерний компонент
     *
     * @param {SP.Component} component компонент который является дочерним этого компонента
     * @return {Boolean} возвращает <b>true</b> при успешном выполнении, в противном случае <b>false</b>
     * @public
     * @final
     * @see {@link get.components}
     */
    removeComponent: function(component) {

      // Условие для внутреннего использования
      if (this instanceof Boolean && arguments.length > 1) {

        var index = -1;

        if ("indexOf" in components) {
          // новая версия ECMAScript имеет поддержку метода indexOf для массивов
          index = components.indexOf(component);
        } else {
          // для более старой версии ECMAScript
          for (var i = components.length; i--;) {
            if (components[i] === component) {
              index = i;
              break;
            }
          }
        }

        if (index >= 0) {

          // удаляем компонент из стека
          components.splice(index, 1);

          // информируем компонент о том что его удалили из родительского компонента
          component.onRemove(arguments[1]);
        }

      } else if (SP.Component.getInstanceOf(component)) {
        // Если объект является компонентом удаляем у него родителя
        return components.length > (component.owner = null, components.length);
      }

      return false;
    },

    /**
     * Содержит список всех дочерних компонентов
     *
     * @type {SP.Component[]}
     * @property
     * @public
     * @see {@link insertComponent}
     * @see {@link removeComponent}
     */
    components: {
      get: function() {
        // не будем возвращать ссылку на оригинальный список компонентов, отдаем копию
        return components.slice(0);
      }
    },

    /**
     * Устанавливает или возвращает позицию компонента
     *
     * Если параметр component не задан, то в случае если задан position установит
     * текущий компонент у его владельца на новую позицию, если же параметр position
     * так же не задан, то вернет текущую позицию у владельца.
     *
     * Если компонент не имеет владельца, вернет значение -1
     *
     * @param {SP.Component} [component]
     * @param {int} [position]
     * @return {int}
     * @public
     */
    componentPosition: function(component, position) {

      // ищем компонент у владельца
      if (typeof component === "number" || !component) {
        return owner ? owner.componentPosition(this, component) : -1;
      }

      var index = -1, length = components.length;

      if ("indexOf" in components) {
        // новая версия ECMAScript имеет поддержку метода indexOf для массивов
        index = components.indexOf(component);
      } else {
        // для более старой версии ECMAScript
        for (var i = components.length; i--;) {
          if (components[i] === component) {
            index = i;
            break;
          }
        }
      }

      // если позиция или компонент не определены, возвращаем текущуюю позицию
      if (typeof position !== "number" || index < 0) {
        return index;
      }

      // попытаемся нормализовать позицию
      while (position < 0 || position >= length) {
        position = position < 0 ? length + position : position >= length ? position - length : position;
      }

      // если текущая позиция не равна новой позиции
      if (index !== position) {

        // удаляем компонент из текущей позиции
        components.splice(index, 1);

        if (position === 0) {
          // вставляем в начало
          components.unshift(component);
        } else if (position === components.length) {
          // вставляем в конец
          components.push(component);
        } else {
          // вставляем где то в середине
          components = components.slice(0, position).concat(component, components.slice(position));
        }

        length = index < position ? position : index;
        index = index < position ? index : position;

        for (; index <= length; index++) {
          components[index].onChangePosition(index);
        }
      }

      // возвращаем позицию компонента
      return position;
    },

    /**
     * Событие страбатывает у владельца в случае если добавляют в него новый компонент
     * Верните <b>false</b> если не хотите что бы в ваш компонент что-то добавляли.
     *
     * @protected
     * @param {SP.Component} component
     */
    onInsertComponent: function(component) {
      /* virtual protected */
    },

    /**
     * Событие срабатывает у владельца при удалении из него компонента
     * Верните <b>false</b> если не хотите что бы из владельца что-то удаляли
     *
     * @protected
     * @param {SP.Component} component
     */
    onRemoveComponent: function(component) {
      /* virtual protected */
    },

    /**
     * Событие срабатывает у компонента в том случае если он был успешно принят владельцем
     *
     * @protected
     * @param {SP.Component} owner
     */
    onInsert: function(owner) {
      /* virtual protected */
    },

    /**
     * Событие срабатывает если компонент успешно был удален владельцем
     *
     * @protected
     * @param {SP.Component} owner
     */
    onRemove: function(owner) {
      /* virtual protected */
    },

    /**
     * Событие срабатывает если сменили позицию компонента
     *
     * @protected
     * @param {int} position
     */
    onChangePosition: function(position) {
      /* virtual protected */
    },

    /**
     * Для отладки
     *
     * @return {String}
     */
    toString: function() {
      return '[object Object]';
    }
  }
});